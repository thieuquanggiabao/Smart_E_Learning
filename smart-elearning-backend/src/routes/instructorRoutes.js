const express = require('express');
const router = express.Router();
const { getInstructorDashboard } = require('../controllers/instructorController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/dashboard', verifyToken, getInstructorDashboard);

module.exports = router;