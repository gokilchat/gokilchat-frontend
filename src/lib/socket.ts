import { io, Socket } from 'socket.io-client';
import { CHAT_SERVER_URL } from './api';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (!socket) {
    socket = io(CHAT_SERVER_URL, {
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
