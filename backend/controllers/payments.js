const User = require("../models/user");
const Course = require("../models/course");
const Order = require("../models/order");
const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");

exports.capturePayment = async (req, res) => {
    try {
        const { coursesId, couponCode, discountAmount } = req.body;
        const userId = req.user.id;

        // Validate coursesId
        if (!coursesId || !Array.isArray(coursesId)) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid course IDs"
            });
        }

        // Check if user already enrolled in any of these courses
        const user = await User.findById(userId);
        const alreadyEnrolledCourses = coursesId.filter(courseId => 
            user.courses.includes(courseId)
        );

        if (alreadyEnrolledCourses.length > 0) {
            return res.status(400).json({
                success: false,
                message: "You are already enrolled in one or more of these courses"
            });
        }

        // Get course details
        const courses = await Course.find({ _id: { $in: coursesId } });
        
        if (!courses || courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Courses not found"
            });
        }

        // Log coupon usage if provided
        if (couponCode) {
            console.log(`Coupon ${couponCode} applied for user ${userId}, discount: ${discountAmount}`);
        }

        // For test development, proceed directly to enrollment
        return res.status(200).json({
            success: true,
            message: "Proceed with enrollment",
            couponApplied: !!couponCode
        });

    } catch (error) {
        console.error("Error in capturePayment:", error);
        res.status(500).json({
            success: false,
            message: "Could not process enrollment"
        });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { coursesId, couponCode, discountAmount } = req.body;
        const userId = req.user.id;

        if (!coursesId || !Array.isArray(coursesId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course IDs provided"
            });
        }

        // Find user and validate
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Validate courses exist
        const courses = await Course.find({ _id: { $in: coursesId } });
        if (courses.length !== coursesId.length) {
            throw new Error("One or more courses not found");
        }

        // Create order records for each course with active status
        const orderPromises = courses.map(course => {
            return Order.create({
                user: userId,
                course: course._id,
                amount: course.price || 0,
                status: true, // Set as active by default
                paymentMethod: 'test', // Default payment method for testing
                transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                purchaseDate: new Date()
            });
        });

        const orders = await Promise.all(orderPromises);

        // Add courses to user's enrolled courses using $addToSet to avoid duplicates
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $addToSet: { courses: { $each: coursesId } }
            },
            { new: true }
        );

        // Update course student counts
        await Course.updateMany(
            { _id: { $in: coursesId } },
            { $addToSet: { studentsEnrolled: userId } }
        );

        // If a coupon was used, log the usage
        if (couponCode) {
            console.log(`Verifying enrollment with coupon ${couponCode} for user ${userId}`);
            console.log(`Applied discount amount: ${discountAmount}`);
        }

        // Send confirmation emails
        for (const course of courses) {
            try {
                const emailSubject = couponCode 
                    ? `Successfully enrolled in ${course.courseName} with coupon ${couponCode}`
                    : `Successfully enrolled in ${course.courseName}`;

                await mailSender(
                    updatedUser.email,
                    emailSubject,
                    courseEnrollmentEmail(course.courseName, updatedUser.firstName)
                );
            } catch (emailError) {
                console.error("Error sending enrollment email:", emailError);
                // Don't fail the enrollment if email fails
            }
        }

        return res.status(200).json({
            success: true,
            message: "Courses enrolled successfully",
            couponApplied: !!couponCode
        });

    } catch (error) {
        console.error("Error in verifyPayment:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Could not complete enrollment"
        });
    }
};

exports.getPurchaseHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user and populate their purchased courses
        const user = await User.findById(userId)
            .populate({
                path: 'courses',
                model: 'Course',
                select: 'courseName price description thumbnail createdAt'
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Transform the courses data to include purchase details
        const purchaseHistory = user.courses.map(course => ({
            _id: course._id,
            courseName: course.courseName,
            courseDescription: course.description,
            thumbnail: course.thumbnail,
            price: course.price || 0,
            purchaseDate: course.createdAt,
            status: "Completed"
        }));

        return res.status(200).json({
            success: true,
            data: purchaseHistory
        });

    } catch (error) {
        console.error("Error fetching purchase history:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch purchase history",
            error: error.message
        });
    }
};
