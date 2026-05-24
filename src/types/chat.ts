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
  members_count?: number;
  last_message?: {
    content: string;
    created_at: string;
    sender: { username: string };
  };
  created_at?: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username: string;
  sender_full_name?: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
  template_type?: string;
  invite_info?: {
    invitee_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    target_room_id: string;
    target_room_name: string;
    target_room_avatar?: string;
  };
  receipts?: {
    user_id: string;
    delivered_at: string | null;
    read_at: string | null;
    user?: {
      username: string;
      full_name?: string;
      avatar_url?: string;
    };
  }[];
}
