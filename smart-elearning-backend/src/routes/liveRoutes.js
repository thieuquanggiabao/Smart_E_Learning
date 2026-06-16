const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { startLiveRoom, joinLiveRoom, endLiveRoom, getLiveRoomStatus } = require('../controllers/liveController');

router.use(verifyToken);

router.get('/:groupId/status', getLiveRoomStatus);
router.post('/:groupId/start', startLiveRoom);
router.post('/:groupId/join', joinLiveRoom);
router.post('/:groupId/end', endLiveRoom);

module.exports = router;
