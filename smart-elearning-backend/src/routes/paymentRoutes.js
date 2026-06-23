const express = require('express');
const router = express.Router();
const { createPaymentLink, receiveWebhook, verifyPayment } = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Endpoint tạo payment link (yêu cầu login)
router.post('/create-payment-link', verifyToken, createPaymentLink);

// Endpoint chủ động kiểm tra trạng thái thanh toán từ frontend (yêu cầu login)
router.post('/verify-payment', verifyToken, verifyPayment);

// Endpoint nhận webhook từ PayOS (không yêu cầu login)
router.post('/webhook', receiveWebhook);

module.exports = router;
