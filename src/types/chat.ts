export interface User {
  id: string;
  username: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
  system_role?: string;
}

export interface Room {
  id: string;
  name: string;
  type?: string;
  owner_id?: string;
  avatar_url?: string;
  dm_user_id?: string;
  created_at?: string;
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
