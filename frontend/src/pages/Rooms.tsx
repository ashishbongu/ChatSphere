import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Loader2, Lock, Plus, Search, RefreshCw, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import RoomCard from '../components/RoomCard';
import CreateRoomModal from '../components/CreateRoomModal';
import { fetchRooms, createRoom, joinRoomById } from '../api/rooms';
import type { Room, RoomVisibility } from '../api/rooms';
import toast from 'react-hot-toast';

/* ──────────────────────────────────────────────
   Private Key Prompt Modal
   ────────────────────────────────────────────── */
interface PrivateKeyModalProps {
  room: Room;
  isOpen: boolean;
  isJoining: boolean;
  onClose: () => void;
  onSubmit: (roomId: string, joinKey: string) => void;
}

function PrivateKeyModal({ room, isOpen, isJoining, onClose, onSubmit }: PrivateKeyModalProps) {
  const [joinKey, setJoinKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinKey.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Please enter the private room key');
      return;
    }
    if (trimmed.length !== 16) {
      toast.error('Room key must be exactly 16 characters');
      return;
    }
    onSubmit(room.id, trimmed);
  };

  // reset key when modal opens/closes
  useEffect(() => {
    if (!isOpen) setJoinKey('');
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-navy-800 rounded-2xl border border-navy-700/50 w-full max-w-sm shadow-2xl shadow-black/50">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-navy-700/50">
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-amber-300" />
                  <h2 className="font-display font-bold text-lg text-white">Private Room</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-navy-700 text-gray-400 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                <div>
                  <p className="text-sm text-white font-medium mb-1">{room.name}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This room is private. Enter the 16-character room key shared by the creator to join.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    <KeyRound size={12} className="inline mr-1 text-amber-300" />
                    Room Key
                  </label>
                  <input
                    type="text"
                    value={joinKey}
                    onChange={(e) => setJoinKey(e.target.value.toUpperCase())}
                    placeholder="Enter 16-character key"
                    maxLength={16}
                    className="w-full px-3 py-2.5 rounded-lg bg-navy-900 border border-navy-600/50 text-sm text-white placeholder-gray-600 focus:border-amber-400/50 transition-colors font-mono tracking-[0.15em] uppercase"
                    autoFocus
                  />
                  <p className="text-[10px] text-gray-600 mt-1 text-right">{joinKey.length}/16</p>
                </div>

                <button
                  type="submit"
                  disabled={isJoining || joinKey.trim().length !== 16}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isJoining ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  {isJoining ? 'Joining...' : 'Join with Key'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────
   Rooms Page
   ────────────────────────────────────────────── */
export default function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [privateKeyRoom, setPrivateKeyRoom] = useState<Room | null>(null);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRooms();
      setRooms(data);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleCreateRoom = async (
    name: string,
    description: string,
    tags: string[],
    maxUsers: number,
    visibility: RoomVisibility
  ) => {
    try {
      const room = await createRoom(name, description, tags, maxUsers, visibility);
      setRooms((prev) => [room, ...prev]);
      setShowCreateModal(false);
      toast.success(visibility === 'private' ? 'Private room created' : 'Room created!');
      navigate(`/group/${room.id}`, {
        state: room.privateJoinKey ? { privateJoinKey: room.privateJoinKey } : undefined,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to create room');
    }
  };

  const handleJoinRoom = async (roomId: string, isMember = false) => {
    const room = rooms.find((entry) => entry.id === roomId);

    // Already a member → just navigate
    if (isMember) {
      navigate(`/group/${roomId}`);
      return;
    }

    // Private room → show key prompt modal
    if (room?.visibility === 'private') {
      setPrivateKeyRoom(room);
      return;
    }

    // Public room → join directly
    setJoiningRoomId(roomId);
    try {
      await joinRoomById(roomId);
      navigate(`/group/${roomId}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to join room');
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handlePrivateKeySubmit = async (roomId: string, joinKey: string) => {
    setJoiningRoomId(roomId);
    try {
      await joinRoomById(roomId, joinKey);
      setPrivateKeyRoom(null);
      toast.success('Private room joined!');
      navigate(`/group/${roomId}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Invalid room key');
    } finally {
      setJoiningRoomId(null);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const q = search.toLowerCase();
    return (
      room.name.toLowerCase().includes(q) ||
      room.description.toLowerCase().includes(q) ||
      room.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Group Rooms</h1>
            <p className="text-gray-500 text-sm mt-1">Join a room or create your own — @ai is always ready</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadRooms}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-navy-800 border border-navy-700/50 text-gray-400 hover:text-white hover:border-navy-600 transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue text-white font-medium text-sm hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-[0.98]"
            >
              <Plus size={16} /> Create Room
            </button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms by name or tag..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-navy-800 border border-navy-700/50 text-white placeholder-gray-600 focus:border-neon-purple/50 transition-colors"
            />
          </div>
        </motion.div>

        {/* Rooms grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-navy-800 animate-pulse border border-navy-700/30" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg font-display">
              {search ? 'No rooms match your search' : 'No rooms yet — be the first to create one!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room, i) => (
              <RoomCard
                key={room.id}
                id={room.id}
                name={room.name}
                description={room.description}
                tags={room.tags}
                messageCount={room.messageCount}
                memberCount={room.memberCount}
                visibility={room.visibility}
                isMember={room.isMember}
                isJoining={joiningRoomId === room.id}
                onJoin={(id, memberState) => void handleJoinRoom(id, memberState)}
                index={i}
              />
            ))}
          </div>
        )}
      </main>

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateRoom}
      />

      {/* Private key prompt modal */}
      {privateKeyRoom && (
        <PrivateKeyModal
          room={privateKeyRoom}
          isOpen={!!privateKeyRoom}
          isJoining={joiningRoomId === privateKeyRoom.id}
          onClose={() => setPrivateKeyRoom(null)}
          onSubmit={(roomId, key) => void handlePrivateKeySubmit(roomId, key)}
        />
      )}
    </div>
  );
}
