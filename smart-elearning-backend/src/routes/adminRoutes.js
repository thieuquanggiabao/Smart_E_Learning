const express = require('express');
const router = express.Router();
const { 
    getSystemLogs, getSystemMetrics,
    getAllUsers, updateUserRole, deleteUser,
    getAllCoursesAdmin, updateCourseStatus, deleteCourseAdmin,
    getAdminRevenue
} = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

// ================= LOGS & METRICS =================
router.get('/logs', verifyToken, requireAdmin, getSystemLogs);
router.get('/metrics', verifyToken, requireAdmin, getSystemMetrics);
router.get('/revenue', verifyToken, requireAdmin, getAdminRevenue);

// ================= USER MANAGEMENT =================
router.get('/users', verifyToken, requireAdmin, getAllUsers);
router.put('/users/:id/role', verifyToken, requireAdmin, updateUserRole);
router.delete('/users/:id', verifyToken, requireAdmin, deleteUser);

// ================= COURSE MANAGEMENT =================
router.get('/courses', verifyToken, requireAdmin, getAllCoursesAdmin);
router.put('/courses/:id/status', verifyToken, requireAdmin, updateCourseStatus);
router.delete('/courses/:id', verifyToken, requireAdmin, deleteCourseAdmin);

module.exports = router;
