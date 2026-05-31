const getChatServerUrl = () => {
  if (process.env.NEXT_PUBLIC_CHAT_SERVER_URL) {
    return process.env.NEXT_PUBLIC_CHAT_SERVER_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname.endsWith('gokilchat.online')) {
      return 'https://api.gokilchat.online';
    }
  }
  return 'http://localhost:4000';
};

export const CHAT_SERVER_URL = getChatServerUrl();

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_jwt', token);
    document.cookie = `supabase_jwt=${token}; path=/; max-age=604800; SameSite=Lax; Secure`;
  }
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('supabase_jwt');
  }
  return null;
};

export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase_jwt');
    document.cookie = 'supabase_jwt=; path=/; max-age=0; SameSite=Lax; Secure';
  }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  let token = getAuthToken();
  if (token === 'null' || token === 'undefined') token = null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${CHAT_SERVER_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (endpoint.startsWith('/auth/google') || endpoint.startsWith('/auth/appeal')) {
      return {
        success: false,
        ...data
      };
    }

    if (response.status === 403 && 
        (data.error?.includes('ditangguhkan') || data.error?.includes('banned')) && 
        !endpoint.startsWith('/auth/google')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase_jwt');
        localStorage.removeItem('gokilchat-auth');
        document.cookie = 'supabase_jwt=; path=/; max-age=0; SameSite=Lax; Secure';
        window.location.href = `/?error=${encodeURIComponent(data.error)}`;
        return new Promise(() => {}); // prevent further execution/renders
      }
    }
    throw new Error(data.error || 'Terjadi kesalahan pada server');
  }

  return data;
};

export const loginWithGoogle = async (google_id_token: string) => {
  return apiFetch('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ google_id_token }),
  });
};

export const loginModeratorWithGoogle = async (google_id_token: string, invite_token: string) => {
  return apiFetch('/auth/google/invite', {
    method: 'POST',
    body: JSON.stringify({ google_id_token, invite_token }),
  });
};

export const kickMember = async (roomId: string, userId: string) => {
  return apiFetch(`/rooms/${roomId}/members/${userId}`, {
    method: 'DELETE',
  });
};

export const updateRoomDetails = async (roomId: string, data: { name?: string, description?: string }) => {
  return apiFetch(`/rooms/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const submitAppeal = async (google_id_token: string, reason: string) => {
  return apiFetch('/auth/appeal', {
    method: 'POST',
    body: JSON.stringify({ google_id_token, reason }),
  });
};
