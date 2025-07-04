// AUTH , IS STUDENT , IS INSTRUCTOR , IS ADMIN

const jwt = require("jsonwebtoken");
require('dotenv').config();


// ================ AUTH ================
// user Authentication by checking token validating
exports.auth = (req, res, next) => {
    try {
        console.log('=== AUTH MIDDLEWARE START ===');
        console.log('Auth middleware called for:', req.method, req.url);
        console.log('Request path:', req.path);
        console.log('Request params:', req.params);
        
        // extract token by anyone from this 3 ways
        const token = req.body?.token || req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');

        console.log('Token extraction:', {
            fromBody: !!req.body?.token,
            fromCookies: !!req.cookies?.token,
            fromHeaders: !!req.header('Authorization'),
            tokenExists: !!token,
            authHeader: req.header('Authorization'),
            tokenPreview: token ? token.substring(0, 20) + '...' : 'No token'
        });

        // if token is missing
        if (!token) {
            console.log('❌ Token is missing - returning 401');
            return res.status(401).json({
                success: false,
                message: 'Token is Missing'
            });
        }

        // verify token
        try {
            console.log('Verifying token...');
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token verified successfully:', {
                email: decode.email,
                accountType: decode.accountType,
                id: decode.id
            });
            
            req.user = decode;
            console.log('✅ User set in request object');
        }
        catch (error) {
            console.log('❌ Error while decoding token:', error.message);
            console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
            console.log('Token that failed:', token.substring(0, 50) + '...');
            return res.status(401).json({
                success: false,
                error: error.message,
                messgae: 'Error while decoding token'
            })
        }
        
        console.log('✅ Auth middleware completed successfully - calling next()');
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('❌ Unexpected error in auth middleware:', error.message);
        console.log('Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            messgae: 'Error while token validating'
        })
    }
}





// ================ IS STUDENT ================
exports.isStudent = (req, res, next) => {
    try {
        // console.log('User data -> ', req.user)
        if (req.user?.accountType != 'Student') {
            return res.status(401).json({
                success: false,
                messgae: 'This Page is protected only for student'
            })
        }
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('Error while cheching user validity with student accountType');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            messgae: 'Error while cheching user validity with student accountType'
        })
    }
}


// ================ IS INSTRUCTOR ================
exports.isInstructor = (req, res, next) => {
    try {
        console.log('=== IS INSTRUCTOR MIDDLEWARE START ===');
        console.log('Checking instructor status for request:', req.method, req.url);
        console.log('User object from request:', req.user);
        
        if (!req.user) {
            console.log('❌ No user object found in request');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Allow both Instructors and Admins
        if (req.user?.accountType !== 'Instructor' && req.user?.accountType !== 'Admin') {
            console.log('❌ User is not instructor or admin:', req.user.accountType);
            return res.status(401).json({
                success: false,
                message: 'This page is protected for Instructors and Admins only',
                currentRole: req.user.accountType
            })
        }
        
        console.log('✅ User verified as Instructor/Admin:', req.user.accountType);
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('❌ Error in isInstructor middleware:', error.message);
        console.log('Error stack:', error.stack);
        console.log('Request user at time of error:', req.user);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while checking user validity with Instructor/Admin accountType'
        })
    }
}


// ================ IS ADMIN ================
exports.isAdmin = (req, res, next) => {
    try {
        console.log('=== IS ADMIN MIDDLEWARE START ===');
        console.log('Checking admin status for request:', req.method, req.url);
        console.log('User object from request:', req.user);
        
        if (!req.user) {
            console.log('❌ No user object found in request');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (req.user.accountType !== 'Admin') {
            console.log('❌ User is not admin:', req.user.accountType);
            return res.status(401).json({
                success: false,
                message: 'This page is protected for Admin only',
                currentRole: req.user.accountType
            });
        }

        console.log('✅ User verified as Admin');
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('❌ Error in isAdmin middleware:', error.message);
        console.log('Error stack:', error.stack);
        console.log('Request user at time of error:', req.user);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while checking admin status'
        });
    }
}


