const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

// Lấy danh sách nhóm mà user tham gia
const getGroups = async (req, res) => {
    try {
        const userId = req.user.userId;
        const snapshot = await db.collection('groups')
            .where('memberIds', 'array-contains', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const groups = [];
        snapshot.forEach(doc => {
            groups.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(groups);
    } catch (error) {
        // Fallback for missing index: query without orderBy then sort in JS
        if (error.message.includes('index')) {
            try {
                const userId = req.user.userId;
                const snapshot = await db.collection('groups')
                    .where('memberIds', 'array-contains', userId)
                    .get();

                const groups = [];
                snapshot.forEach(doc => groups.push({ id: doc.id, ...doc.data() }));
                
                groups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                return res.status(200).json(groups);
            } catch (fallbackError) {
                console.error('Lỗi lấy nhóm (fallback):', fallbackError);
                return res.status(500).json({ message: 'Lỗi server', error: fallbackError.message });
            }
        }
        
        console.error('Lỗi lấy nhóm:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Tạo nhóm mới
const createGroup = async (req, res) => {
    try {
        const { name, description, coverImage } = req.body;
        const ownerId = req.user.userId;
        const ownerName = req.user.name || 'Người dùng';
        const ownerEmail = req.user.email || '';

        const newGroup = {
            name,
            description: description || '',
            coverImage: coverImage || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // default cover
            ownerId,
            adminIds: [ownerId],
            memberIds: [ownerId],
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('groups').add(newGroup);

        // Lưu bản thân người tạo vào sub-collection members
        await docRef.collection('members').doc(ownerId).set({
            userId: ownerId,
            name: ownerName,
            email: ownerEmail,
            role: 'owner',
            joinedAt: new Date().toISOString()
        });

        res.status(201).json({ id: docRef.id, ...newGroup });
    } catch (error) {
        console.error('Lỗi tạo nhóm:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy thông tin nhóm và danh sách thành viên
const getGroupDetail = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.userId;

        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        
        const groupData = groupDoc.data();
        if (!groupData.memberIds.includes(userId)) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập nhóm này' });
        }

        // Fetch members and enrich with actual user data
        const membersSnap = await db.collection('groups').doc(groupId).collection('members').get();
        const members = [];
        for (const doc of membersSnap.docs) {
            const memberData = doc.data();
            const userDoc = await db.collection('users').doc(memberData.userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                members.push({
                    ...memberData,
                    name: userData.name || memberData.name,
                    systemRole: userData.role || 'student',
                    avatarUrl: userData.avatarUrl || null
                });
            } else {
                members.push(memberData);
            }
        }

        res.status(200).json({
            ...groupData,
            id: groupDoc.id,
            members
        });
    } catch (error) {
        console.error('Lỗi chi tiết nhóm:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const storage = new Storage({
    keyFilename: path.join(__dirname, '../config/gcs-key.json')
});
const bucketName = 'smart-9e93c.firebasestorage.app';

// Thêm thành viên bằng email
const addMemberByEmail = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { email } = req.body;
        const currentUserId = req.user.userId;

        if (!email) return res.status(400).json({ message: 'Vui lòng nhập email' });

        const groupRef = db.collection('groups').doc(groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        
        // Kiểm tra xem ai là người đang add (có thể cho phép ai cũng add được hoặc chỉ owner)
        // Hiện tại đề bài: "Ai cũng có thể tự tạo nhóm, thêm người bằng tài khoản email"
        if (!groupDoc.data().memberIds.includes(currentUserId)) {
            return res.status(403).json({ message: 'Bạn không thuộc nhóm này' });
        }

        // Tìm user theo email
        const userQuery = await db.collection('users').where('email', '==', email.trim()).limit(1).get();
        if (userQuery.empty) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này trong hệ thống' });
        }

        const userDoc = userQuery.docs[0];
        const newMemberId = userDoc.id;
        const newMemberData = userDoc.data();

        // Kiểm tra đã trong nhóm chưa
        if (groupDoc.data().memberIds.includes(newMemberId)) {
            return res.status(400).json({ message: 'Người dùng đã ở trong nhóm' });
        }

        // Thêm memberId vào mảng memberIds
        const updatedMemberIds = [...groupDoc.data().memberIds, newMemberId];
        await groupRef.update({ memberIds: updatedMemberIds });

        // Thêm vào sub-collection
        const newMemberInfo = {
            userId: newMemberId,
            name: newMemberData.name || 'Học viên',
            email: newMemberData.email,
            role: 'member',
            joinedAt: new Date().toISOString()
        };

        await groupRef.collection('members').doc(newMemberId).set(newMemberInfo);

        // EMIT SỰ KIỆN QUA SOCKET.IO
        const io = req.app.get('io');
        if (io) {
            io.to(groupId).emit('memberAdded', newMemberInfo);
        }

        res.status(200).json({ message: 'Thêm thành viên thành công', member: newMemberInfo });

    } catch (error) {
        console.error('Lỗi thêm thành viên:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy lịch sử tin nhắn của nhóm
const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.userId;

        // Check if user is in group
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists || !groupDoc.data().memberIds.includes(userId)) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }

        // Fetch last 50 messages
        const messagesSnap = await db.collection('groups').doc(groupId)
            .collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const messages = [];
        messagesSnap.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        // Đảo ngược lại để tin nhắn cũ ở trên, mới ở dưới
        res.status(200).json(messages.reverse());
    } catch (error) {
        // Fallback if missing index
        if (error.message.includes('index')) {
            try {
                const { groupId } = req.params;
                const snap = await db.collection('groups').doc(groupId).collection('messages').get();
                const msgs = [];
                snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
                msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                return res.status(200).json(msgs.slice(-50));
            } catch(e) {
                return res.status(500).json({ message: 'Lỗi lấy tin nhắn', error: e.message });
            }
        }
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Giải tán nhóm
const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.userId;

        const groupRef = db.collection('groups').doc(groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }

        if (groupDoc.data().ownerId !== userId) {
            return res.status(403).json({ message: 'Chỉ chủ nhóm mới có quyền giải tán nhóm' });
        }

        // 1. Xóa tất cả messages
        const messagesSnap = await groupRef.collection('messages').get();
        const batch = db.batch();
        messagesSnap.forEach(doc => batch.delete(doc.ref));

        // 2. Xóa tất cả members
        const membersSnap = await groupRef.collection('members').get();
        membersSnap.forEach(doc => batch.delete(doc.ref));

        // 3. Xóa group
        batch.delete(groupRef);
        await batch.commit();

        // 4. Xóa thư mục trên GCS (Storage)
        // Cloud Storage uses prefix for folders
        try {
            const bucket = storage.bucket(bucketName);
            await bucket.deleteFiles({
                prefix: `groups/${groupId}/`
            });
            console.log(`Đã xóa files thuộc nhóm ${groupId}`);
        } catch (storageError) {
            console.error('Lỗi khi xóa files trên storage (có thể bỏ qua):', storageError);
        }

        // Báo cho các người dùng đang online biết nhóm đã giải tán
        const io = req.app.get('io');
        if (io) {
            io.to(groupId).emit('groupDeleted', { groupId });
        }

        res.status(200).json({ message: 'Đã giải tán nhóm thành công' });
    } catch (error) {
        console.error('Lỗi giải tán nhóm:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Cập nhật vai trò thành viên (admin/member)
const updateMemberRole = async (req, res) => {
    try {
        const { groupId, userId } = req.params; // userId là ID của người được thay đổi quyền
        const { role } = req.body; // 'admin' hoặc 'member'
        const currentUserId = req.user.userId;

        if (!['admin', 'member'].includes(role)) {
            return res.status(400).json({ message: 'Role không hợp lệ' });
        }

        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        
        const groupData = groupDoc.data();
        const { ownerId, adminIds = [] } = groupData;

        // 1. Kiểm tra quyền của người gọi API (currentUserId)
        const isOwner = currentUserId === ownerId;
        const isAdmin = adminIds.includes(currentUserId);
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
        }

        // 2. Không ai được thay đổi quyền của Owner
        if (userId === ownerId) {
            return res.status(403).json({ message: 'Không thể thay đổi quyền của người tạo nhóm' });
        }

        // 3. Nếu người gọi API là admin (nhưng không phải owner), họ không thể hủy quyền của một admin khác
        if (!isOwner && isAdmin && role === 'member') {
            if (adminIds.includes(userId)) {
                return res.status(403).json({ message: 'Chỉ Trưởng nhóm mới có quyền hủy chức vụ Quản trị viên' });
            }
        }

        // 4. Kiểm tra user bị đổi quyền có trong nhóm không
        if (!groupData.memberIds.includes(userId)) {
            return res.status(404).json({ message: 'Người dùng không thuộc nhóm này' });
        }

        // Tiến hành cập nhật
        const batch = db.batch();
        const groupRef = db.collection('groups').doc(groupId);
        const memberRef = groupRef.collection('members').doc(userId);

        // Cập nhật role trong sub-collection members
        batch.update(memberRef, { role });

        // Cập nhật adminIds ở document chính
        const adminFieldUpdate = role === 'admin' 
            ? FieldValue.arrayUnion(userId)
            : FieldValue.arrayRemove(userId);
            
        batch.update(groupRef, { adminIds: adminFieldUpdate });

        await batch.commit();

        res.status(200).json({ message: `Đã cập nhật quyền thành công` });
    } catch (error) {
        console.error('Lỗi cập nhật quyền thành viên:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = {
    getGroups,
    createGroup,
    getGroupDetail,
    addMemberByEmail,
    getGroupMessages,
    deleteGroup,
    updateMemberRole
};
