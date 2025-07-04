const User = require('../models/user');
const mailSender = require('../utils/mailSender');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { resetPasswordTemplate } = require('../mail/templates/resetPasswordTemplate');

// Rate limiting storage (in production, use Redis)
const resetAttempts = new Map();

// Helper function to check rate limiting
const checkRateLimit = (email) => {
    const now = Date.now();
    const attempts = resetAttempts.get(email) || { count: 0, lastAttempt: 0 };
    
    // Reset counter if more than 15 minutes have passed
    if (now - attempts.lastAttempt > 15 * 60 * 1000) {
        attempts.count = 0;
    }
    
    // Allow max 3 attempts per 15 minutes
    if (attempts.count >= 3) {
        const timeLeft = Math.ceil((15 * 60 * 1000 - (now - attempts.lastAttempt)) / 60000);
        return { allowed: false, timeLeft };
    }
    
    return { allowed: true };
};

// Helper function to update rate limiting
const updateRateLimit = (email) => {
    const now = Date.now();
    const attempts = resetAttempts.get(email) || { count: 0, lastAttempt: 0 };
    attempts.count += 1;
    attempts.lastAttempt = now;
    resetAttempts.set(email, attempts);
};

// Helper function to validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Helper function to validate password strength
const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return errors;
};

// ================ resetPasswordToken ================
exports.resetPasswordToken = async (req, res) => {
    try {
        const { email } = req.body;

        // Input validation
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Check rate limiting
        const rateCheck = checkRateLimit(email);
        if (!rateCheck.allowed) {
            return res.status(429).json({
                success: false,
                message: `Too many password reset attempts. Please try again in ${rateCheck.timeLeft} minutes.`
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // For security, don't reveal if email exists or not
            return res.status(200).json({
                success: true,
                message: 'If an account with this email exists, you will receive a password reset link shortly.'
            });
        }

        // Update rate limiting
        updateRateLimit(email);

        // Check if user already has a valid reset token
        if (user.resetPasswordTokenExpires && user.resetPasswordTokenExpires > Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'A password reset email has already been sent. Please check your email or wait before requesting another.'
            });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

        // Update user with token
        await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { 
                token: token, 
                resetPasswordTokenExpires: tokenExpiry
            },
            { new: true }
        );

        // Create reset URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/update-password/${token}`;

        // Send email
        try {
            const emailTemplate = resetPasswordTemplate(email, resetUrl, user.firstName || 'User');
            await mailSender(
                email, 
                'Reset Your Password - Beeja Learning Platform', 
                emailTemplate
            );

            console.log(`Password reset email sent to: ${email}`);
        } catch (emailError) {
            console.error('Failed to send reset email:', emailError);
            
            // Clear the token if email fails
            await User.findOneAndUpdate(
                { email: email.toLowerCase() },
                { 
                    token: null, 
                    resetPasswordTokenExpires: null
                }
            );

            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again later.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset instructions have been sent to your email address. Please check your inbox and spam folder.'
        });

    } catch (error) {
        console.error('Error in resetPasswordToken:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again later.'
        });
    }
};

// ================ resetPassword ================
exports.resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        // Input validation
        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Validate password strength
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Password does not meet requirements',
                errors: passwordErrors
            });
        }

        // Find user by token
        const user = await User.findOne({ 
            token: token,
            resetPasswordTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token. Please request a new password reset.'
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update user password and clear reset token
        await User.findByIdAndUpdate(
            user._id,
            { 
                password: hashedPassword,
                token: null,
                resetPasswordTokenExpires: null,
                updatedAt: new Date()
            },
            { new: true }
        );

        // Send confirmation email
        try {
            await mailSender(
                user.email,
                'Password Successfully Reset - Beeja Learning Platform',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Successful</h2>
                    <p>Hello ${user.firstName || 'User'},</p>
                    <p>Your password has been successfully reset for your Beeja Learning Platform account.</p>
                    <p>If you did not make this change, please contact our support team immediately.</p>
                    <p>For security reasons, you may want to:</p>
                    <ul>
                        <li>Log in with your new password</li>
                        <li>Review your account activity</li>
                        <li>Update your security settings</li>
                    </ul>
                    <p>Thank you for using Beeja Learning Platform!</p>
                </div>
                `
            );
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't fail the request if confirmation email fails
        }

        console.log(`Password successfully reset for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now log in with your new password.'
        });

    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while resetting your password. Please try again.'
        });
    }
};

// ================ verifyResetToken ================
exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is required'
            });
        }

        // Find user with valid token
        const user = await User.findOne({ 
            token: token,
            resetPasswordTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Reset token is valid',
            data: {
                email: user.email,
                expiresAt: user.resetPasswordTokenExpires
            }
        });

    } catch (error) {
        console.error('Error in verifyResetToken:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while verifying the reset token'
        });
    }
};
