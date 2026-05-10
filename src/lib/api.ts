const CHAT_SERVER_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:4000';

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_jwt', token);
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
  }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
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
