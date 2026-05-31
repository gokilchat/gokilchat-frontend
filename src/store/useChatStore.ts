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
  deleteMessage: (messageId: string, deletedAt?: string | null, deletedBy?: string | null) => void;
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
  deleteMessage: (messageId, deletedAt, deletedBy) => set((state) => {
    const now = deletedAt || new Date().toISOString();
    const updatedMessages = state.messages.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            deleted_at: now, 
            deleted_by: deletedBy || null 
          } 
        : msg
    );

    // Update child message reply previews
    const deletedText = 'Pesan ini dihapus oleh admin';
    const finalMessages = updatedMessages.map(msg =>
      msg.parent_id === messageId
        ? { ...msg, reply_preview: deletedText }
        : msg
    );

    // Update last_message in sidebar room preview
    const updatedRooms = state.rooms.map(room => {
      const deletedMsg = state.messages.find(m => m.id === messageId);
      if (deletedMsg && room.id === deletedMsg.room_id && room.last_message) {
        const isSelf = deletedBy === deletedMsg.sender_id;
        const noteText = isSelf ? "Pesan ini telah dihapus" : "Pesan ini dihapus oleh admin";
        return {
          ...room,
          last_message: {
            ...room.last_message,
            content: noteText
          }
        };
      }
      return room;
    });

    return { messages: finalMessages, rooms: updatedRooms };
  }),
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
