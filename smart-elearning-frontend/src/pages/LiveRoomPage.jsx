import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '@livekit/components-styles';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useParticipants,
  VideoTrack,
  AudioTrack,
  useParticipantInfo,
} from '@livekit/components-react';
import { Track, DisconnectReason } from 'livekit-client';
import { ArrowLeft, Wifi, WifiOff, Users, Clock } from 'lucide-react';
import api from '../services/api';

// ─── Video Grid Component ─────────────────────────────────────────────────────
function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Kiểm tra xem có track chia sẻ màn hình nào đang hoạt động không
  const screenShareTrack = tracks.find(
    (t) => t.source === Track.Source.ScreenShare
  );

  if (screenShareTrack) {
    const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

    return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] w-full gap-4 p-4 overflow-hidden">
        {/* Khung chia sẻ màn hình chính (Focus) */}
        <div className="flex-1 bg-black/40 rounded-xl overflow-hidden border border-white/5 relative bg-slate-900/40">
          <ParticipantTile trackRef={screenShareTrack} />
        </div>

        {/* Thanh bên hiển thị camera các thành viên */}
        <div className="w-full md:w-80 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 pb-2 md:pb-0 pr-0 md:pr-1">
          {cameraTracks.map((track) => (
            <div 
              key={`${track.participant.identity}-${track.source}`} 
              className="w-48 md:w-full aspect-video rounded-xl overflow-hidden border border-white/5 relative bg-slate-900/60 shrink-0"
            >
              <ParticipantTile trackRef={track} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Nếu không chia sẻ màn hình, dùng GridLayout chuẩn cho camera
  return (
    <GridLayout
      tracks={tracks.filter((t) => t.source === Track.Source.Camera)}
      style={{ height: 'calc(100vh - 120px)' }}
    >
      <ParticipantTile />
    </GridLayout>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LiveRoomPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [livekitUrl, setLivekitUrl] = useState('');
  const [roomName, setRoomName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    joinRoom();
  }, [groupId]);

  // Đếm thời gian
  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [connected]);

  const joinRoom = async () => {
    try {
      // Lấy tên nhóm
      const groupRes = await api.get(`/groups/${groupId}`);
      setGroupName(groupRes.data.name);

      // Lấy token tham gia phòng
      const res = await api.post(`/live/${groupId}/join`);
      setToken(res.data.token);
      setLivekitUrl(res.data.livekitUrl);
      setRoomName(res.data.roomName);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể kết nối phòng học';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = useCallback((reason) => {
    // Chỉ navigate ra ngoài khi disconnect có lý do CỤ THỂ, rõ ràng:
    // CLIENT_INITIATED: User bấm nút "Rời phòng"
    // ROOM_DELETED: Chủ phòng kết thúc phiên (endLiveRoom)
    // PARTICIPANT_REMOVED: Bị kick
    // SERVER_SHUTDOWN: Server LiveKit tắt
    // 
    // KHÔNG navigate khi reason = undefined (LiveKit tự reconnect nội bộ
    // xảy ra khi người thứ 2 vào phòng, mạng chập chờn...)
    const intentionalReasons = [
      DisconnectReason.CLIENT_INITIATED,
      DisconnectReason.ROOM_DELETED,
      DisconnectReason.PARTICIPANT_REMOVED,
      DisconnectReason.SERVER_SHUTDOWN,
    ];

    if (intentionalReasons.includes(reason)) {
      navigate(`/groups/${groupId}`);
    }
    // Nếu reason là undefined hoặc UNKNOWN → bỏ qua, LiveKit sẽ tự reconnect
  }, [groupId, navigate]);

  const handleEndRoom = async () => {
    if (!window.confirm('Bạn có chắc muốn kết thúc phiên học cho tất cả mọi người?')) return;
    try {
      await api.post(`/live/${groupId}/end`);
    } catch (err) {
      console.error('Lỗi kết thúc phòng:', err);
    }
    navigate(`/groups/${groupId}`);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050510] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400 text-lg">Đang kết nối vào phòng học...</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="fixed inset-0 bg-[#050510] flex flex-col items-center justify-center gap-6 p-8">
        <WifiOff size={48} className="text-red-500" />
        <h2 className="text-2xl font-bold text-white">Không thể vào phòng</h2>
        <p className="text-slate-400 text-center max-w-sm">{error}</p>
        <button
          onClick={() => navigate(`/groups/${groupId}`)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
        >
          <ArrowLeft size={18} /> Quay lại nhóm
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#050510] flex flex-col overflow-hidden" data-lk-theme="default">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/50 border-b border-white/5 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs text-slate-500 leading-none">Phòng học</p>
            <h1 className="text-sm font-bold text-white leading-tight">{groupName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {connected && (
            <>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <Wifi size={14} />
                <span className="font-medium">Đang kết nối</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Clock size={14} />
                <span className="font-mono">{formatTime(elapsedTime)}</span>
              </div>
            </>
          )}
          <button
            onClick={handleEndRoom}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs rounded-lg font-medium transition-colors border border-red-500/20"
          >
            Kết thúc phiên
          </button>
        </div>
      </div>

      {/* LiveKit Room */}
      <div className="flex-1 overflow-hidden">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={livekitUrl}
          data-lk-theme="default"
          style={{ height: '100%' }}
          onConnected={() => setConnected(true)}
          onDisconnected={handleDisconnect}
        >
          <VideoGrid />
          <RoomAudioRenderer />
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 z-20">
            <ControlBar
              controls={{
                camera: true,
                microphone: true,
                screenShare: true,
                leave: true,
                chat: false,
              }}
            />
          </div>
        </LiveKitRoom>
      </div>
    </div>
  );
}
