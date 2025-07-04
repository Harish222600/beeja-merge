const express = require('express');
const router = express.Router();

// Import controllers
const {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getAllCourses,
    createCourseAsAdmin,
    approveCourse,
    deleteCourse,
    getAnalytics,
    toggleUserStatus,
    toggleCourseVisibility,
    setCourseType,
    getAllInstructors,
    sendNotification,
    getAllNotifications,
    deleteNotification
} = require('../controllers/admin');
const { 
    createCoupon, 
    validateCoupon, 
    applyCoupon, 
    validateAndApplyCoupon,
    getAllCoupons, 
    getFrontendCoupons, 
    toggleCouponStatus,
    getCouponAnalytics,
    cleanupExpiredCoupons
} = require('../controllers/coupon');
const { getAllOrders, deleteOrder, updateOrderStatus, generateOrdersPDF } = require('../controllers/order');

// Import middleware
const { auth, isAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/multer');
const { couponValidationLimiter } = require('../middleware/rateLimiter');

// ================ USER MANAGEMENT ROUTES ================
router.get('/users', auth, isAdmin, getAllUsers);
router.post('/users', auth, isAdmin, createUser);
router.put('/users/:userId', auth, isAdmin, updateUser);
router.delete('/users/:userId', auth, isAdmin, deleteUser);
router.put('/users/:userId/toggle-status', auth, isAdmin, toggleUserStatus);

// ================ COURSE MANAGEMENT ROUTES ================
router.get('/courses', auth, isAdmin, getAllCourses);
router.post('/courses/create', auth, isAdmin, upload.fields([{ name: "thumbnailImage", maxCount: 1 }]), createCourseAsAdmin);
router.put('/courses/:courseId/approve', auth, isAdmin, approveCourse);
router.delete('/courses/:courseId', auth, isAdmin, deleteCourse);
router.put('/courses/:courseId/toggle-visibility', auth, isAdmin, toggleCourseVisibility);
router.put('/courses/:courseId/set-type', auth, isAdmin, setCourseType);

// ================ INSTRUCTOR ROUTES ================
router.get('/instructors', auth, isAdmin, getAllInstructors);

// ================ ANALYTICS ROUTES ================
router.get('/analytics', auth, isAdmin, getAnalytics);

// ================ COUPON ROUTES ================
router.get('/coupons', auth, isAdmin, getAllCoupons);
router.get('/coupons/frontend', getFrontendCoupons); // Public endpoint for frontend coupons
router.get('/coupons/:couponId/analytics', auth, isAdmin, getCouponAnalytics); // Get analytics for specific coupon
router.post('/coupons/create', auth, isAdmin, createCoupon);
router.post('/coupons/validate', auth, couponValidationLimiter, validateCoupon); // Legacy endpoint with rate limiting
router.post('/coupons/apply', auth, couponValidationLimiter, applyCoupon); // Legacy endpoint with rate limiting
router.post('/coupons/validate-and-apply', auth, couponValidationLimiter, validateAndApplyCoupon); // New combined endpoint
router.patch('/coupons/:couponId/toggle', auth, isAdmin, toggleCouponStatus);
router.post('/coupons/cleanup-expired', auth, isAdmin, cleanupExpiredCoupons); // Cleanup expired coupons

// ================ ORDER ROUTES ================
router.get('/orders', auth, isAdmin, getAllOrders);
router.delete('/orders/:orderId', auth, isAdmin, deleteOrder);
router.patch('/orders/:orderId/status', auth, isAdmin, updateOrderStatus);
router.get('/orders/export-pdf', auth, isAdmin, generateOrdersPDF);

// ================ NOTIFICATION MANAGEMENT ROUTES ================
router.post('/notifications/send', auth, isAdmin, sendNotification);
router.get('/notifications', auth, isAdmin, getAllNotifications);
router.delete('/notifications/:notificationId', auth, isAdmin, deleteNotification);

module.exports = router;
