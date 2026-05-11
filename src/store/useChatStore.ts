import { create } from 'zustand';

export interface Room {
  id: string;
  name: string;
  type: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar: string;
  content: string;
  created_at: string;
}

interface ChatState {
  rooms: Room[];
  activeRoomId: string | null;
  messages: Message[];
  setRooms: (rooms: Room[]) => void;
  setActiveRoomId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  activeRoomId: null,
  messages: [],
  setRooms: (rooms) => set({ rooms }),
  setActiveRoomId: (id) => set({ activeRoomId: id, messages: [] }), // clear messages on room change until fetched
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => {
    if (state.activeRoomId === message.room_id) {
      return { messages: [...state.messages, message] };
    }
    return state;
  }),
}));
