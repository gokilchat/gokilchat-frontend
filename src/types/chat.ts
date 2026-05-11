export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'group' | 'private';
  owner_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
}
