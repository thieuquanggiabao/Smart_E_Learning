const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const { db } = require('../config/firebase');

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://your-project.livekit.cloud';

// ─── BẮT ĐẦU PHIÊN LIVE ───────────────────────────────────────────────────────
const startLiveRoom = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.uid || req.user.userId; // Firebase UID

        // Kiểm tra nhóm tồn tại và user là thành viên
        const groupRef = db.collection('groups').doc(groupId);
        const groupSnap = await groupRef.get();
        if (!groupSnap.exists) {
            return res.status(404).json({ message: 'Nhóm không tồn tại' });
        }

        const groupData = groupSnap.data();
        if (!groupData.memberIds?.includes(userId)) {
            return res.status(403).json({ message: 'Bạn không phải thành viên nhóm này' });
        }

        const isAdmin = groupData.adminIds?.includes(userId) || groupData.ownerId === userId;
        if (!isAdmin) {
            return res.status(403).json({ message: 'Chỉ Quản trị viên mới có quyền tạo phòng Live' });
        }

        // Nếu đã có phòng đang live thì không tạo mới
        if (groupData.liveRoom?.active) {
            return res.status(409).json({ 
                message: 'Phòng live đã tồn tại', 
                roomName: groupData.liveRoom.roomName 
            });
        }

        // Tạo tên phòng duy nhất
        const roomName = `group-${groupId}-${Date.now()}`;

        // Lưu trạng thái vào Firestore
        await groupRef.update({
            liveRoom: {
                active: true,
                roomName,
                startedAt: new Date().toISOString(),
                startedBy: userId,
                startedByName: req.user.name || 'Thành viên'
            }
        });

        // Notify realtime qua Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(groupId).emit('roomStarted', {
                roomName,
                startedBy: req.user.name || 'Thành viên',
                groupId
            });
        }

        res.status(200).json({ 
            message: 'Phòng live đã được tạo',
            roomName,
            livekitUrl: LIVEKIT_URL
        });

    } catch (error) {
        console.error('Lỗi tạo phòng live:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ─── LẤY TOKEN THAM GIA PHÒNG ────────────────────────────────────────────────
const joinLiveRoom = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.uid || req.user.userId; // Firebase UID - luôn unique
        const userName = req.user.name || req.user.displayName || req.user.email || 'Học viên';
        const userEmail = req.user.email || '';

        // Identity: kết hợp userId + email để đảm bảo unique 100%
        // LiveKit sử dụng identity để nhận diện participant
        const identity = `${userId}`; // Firebase UID là unique theo design

        // Kiểm tra nhóm và phòng
        const groupSnap = await db.collection('groups').doc(groupId).get();
        if (!groupSnap.exists) {
            return res.status(404).json({ message: 'Nhóm không tồn tại' });
        }

        const groupData = groupSnap.data();
        if (!groupData.memberIds?.includes(userId)) {
            return res.status(403).json({ message: 'Bạn không phải thành viên nhóm này' });
        }

        if (!groupData.liveRoom?.active) {
            return res.status(404).json({ message: 'Không có phòng live nào đang hoạt động' });
        }

        const roomName = groupData.liveRoom.roomName;

        // Tạo Access Token LiveKit
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: identity,        // Firebase UID — unique mỗi user
            name: userName,            // Tên hiển thị trong phòng
            ttl: '2h',
        });

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        const token = await at.toJwt();

        res.status(200).json({
            token,
            roomName,
            livekitUrl: LIVEKIT_URL,
            userName,
            userEmail,
            userId: identity
        });

    } catch (error) {
        console.error('Lỗi lấy token phòng live:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ─── KẾT THÚC PHIÊN LIVE ─────────────────────────────────────────────────────
const endLiveRoom = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.userId;

        const groupRef = db.collection('groups').doc(groupId);
        const groupSnap = await groupRef.get();
        if (!groupSnap.exists) {
            return res.status(404).json({ message: 'Nhóm không tồn tại' });
        }

        const groupData = groupSnap.data();
        if (!groupData.memberIds?.includes(userId)) {
            return res.status(403).json({ message: 'Bạn không phải thành viên nhóm này' });
        }

        const isAdmin = groupData.adminIds?.includes(userId) || groupData.ownerId === userId;
        if (!isAdmin) {
            return res.status(403).json({ message: 'Chỉ Quản trị viên mới có quyền kết thúc phòng Live' });
        }

        if (!groupData.liveRoom?.active) {
            return res.status(404).json({ message: 'Không có phòng live nào đang hoạt động' });
        }

        const roomName = groupData.liveRoom.roomName;

        // Gọi LiveKit API để xóa phòng (kick tất cả)
        try {
            const roomService = new RoomServiceClient(
                LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://'),
                LIVEKIT_API_KEY,
                LIVEKIT_API_SECRET
            );
            await roomService.deleteRoom(roomName);
            console.log(`Đã xóa phòng LiveKit: ${roomName}`);
        } catch (livekitErr) {
            // Nếu phòng không tồn tại trên LiveKit (đã hết) thì bỏ qua
            console.warn('Cảnh báo: Không thể xóa phòng trên LiveKit:', livekitErr.message);
        }

        // Cập nhật Firestore
        await groupRef.update({
            liveRoom: {
                active: false,
                roomName,
                endedAt: new Date().toISOString(),
                endedBy: userId
            }
        });

        // Notify realtime
        const io = req.app.get('io');
        if (io) {
            io.to(groupId).emit('roomEnded', { groupId });
        }

        res.status(200).json({ message: 'Đã kết thúc phiên live' });

    } catch (error) {
        console.error('Lỗi kết thúc phòng live:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ─── LẤY TRẠNG THÁI PHÒNG ────────────────────────────────────────────────────
const getLiveRoomStatus = async (req, res) => {
    try {
        const { groupId } = req.params;

        const groupSnap = await db.collection('groups').doc(groupId).get();
        if (!groupSnap.exists) {
            return res.status(404).json({ message: 'Nhóm không tồn tại' });
        }

        const liveRoom = groupSnap.data().liveRoom || { active: false };
        res.status(200).json(liveRoom);

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = { startLiveRoom, joinLiveRoom, endLiveRoom, getLiveRoomStatus };
