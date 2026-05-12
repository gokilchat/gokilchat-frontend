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
}));
