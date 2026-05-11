import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:4000', {
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
