const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getGroups, createGroup, getGroupDetail, addMemberByEmail, getGroupMessages, deleteGroup } = require('../controllers/groupController');

// Tất cả endpoints đều cần đăng nhập
router.use(verifyToken);

router.get('/', getGroups);
router.post('/', createGroup);
router.get('/:groupId', getGroupDetail);
router.post('/:groupId/members', addMemberByEmail);
router.get('/:groupId/messages', getGroupMessages);
router.delete('/:groupId', deleteGroup);

module.exports = router;
