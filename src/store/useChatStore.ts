import { create } from 'zustand';
import { Room, Message } from '@/types/chat';

interface ChatState {
  rooms: Room[];
  activeRoomId: string | null;
  messages: Message[];
  setRooms: (rooms: Room[] | ((prev: Room[]) => Room[])) => void;
  setActiveRoomId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  deleteMessage: (messageId: string, deletedAt?: string | null, deletedBySelf?: boolean) => void;
  setMessageHidden: (messageId: string, hidden: boolean) => void;
  clearRoomMessages: (roomId: string) => void;
  updateReceipts: (receipts: { message_id: string; user_id: string; delivered_at: string | null; read_at: string | null }[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  activeRoomId: null,
  messages: [],
  setRooms: (rooms) => set((state) => ({ 
    rooms: typeof rooms === 'function' ? rooms(state.rooms) : rooms 
  })),
  setActiveRoomId: (id) => set({ activeRoomId: id, messages: [] }), // clear messages on room change until fetched
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => {
    if (state.activeRoomId === message.room_id) {
      const alreadyExists = state.messages.some(m => m.id === message.id);
      if (alreadyExists) return state;
      return { messages: [...state.messages, message] };
    }
    return state;
  }),
  deleteMessage: (messageId, deletedAt, deletedBySelf) => set((state) => {
    const now = deletedAt || new Date().toISOString();
    const target = state.messages.find(m => m.id === messageId);
    const noteText = deletedBySelf ? 'Pesan ini telah dihapus' : 'Pesan ini dihapus oleh admin';

    // deleted_by harus konsisten dengan MessageBubble (deletedBySelf = deleted_by === sender_id).
    // Self → samakan ke sender_id; bukan self → marker yang pasti beda dari sender_id.
    const deletedByValue = deletedBySelf ? (target?.sender_id ?? null) : '__admin__';

    const updatedMessages = state.messages.map(msg =>
      msg.id === messageId
        ? { ...msg, deleted_at: now, deleted_by: deletedByValue }
        : msg
    );

    // Update child message reply previews
    const finalMessages = updatedMessages.map(msg =>
      msg.parent_id === messageId
        ? { ...msg, reply_preview: noteText }
        : msg
    );

    // Update last_message in sidebar room preview
    const updatedRooms = state.rooms.map(room =>
      target && room.id === target.room_id && room.last_message
        ? { ...room, last_message: { ...room.last_message, content: noteText } }
        : room
    );

    return { messages: finalMessages, rooms: updatedRooms };
  }),
  // Hapus untuk diri sendiri — pesan tetap ada, cuma di-mark hidden (placeholder + tombol Tampilkan)
  setMessageHidden: (messageId, hidden) => set((state) => ({
    messages: state.messages.map((m) =>
      m.id === messageId ? { ...m, hidden_for_me: hidden } : m
    ),
  })),
  // Bersihkan chat DM — kosongkan view + buang preview last_message di sidebar
  clearRoomMessages: (roomId) => set((state) => ({
    messages: state.activeRoomId === roomId ? [] : state.messages,
    rooms: state.rooms.map((r) =>
      r.id === roomId ? { ...r, last_message: undefined, unread_count: 0 } : r
    ),
  })),
  updateReceipts: (receipts) => set((state) => {
    const newMessages = state.messages.map(msg => {
      const msgReceipts = receipts.filter(r => r.message_id === msg.id);
      if (msgReceipts.length === 0) return msg;
      
      const updatedMsgReceipts = [...(msg.receipts || [])];
      
      msgReceipts.forEach(newR => {
        const idx = updatedMsgReceipts.findIndex(r => r.user_id === newR.user_id);
        if (idx >= 0) {
          updatedMsgReceipts[idx] = { ...updatedMsgReceipts[idx], ...newR };
        } else {
          updatedMsgReceipts.push(newR);
        }
      });
      
      return { ...msg, receipts: updatedMsgReceipts };
    });
    return { messages: newMessages };
  }),
}));
