import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user, addMessage } = useStore();

  useEffect(() => {
    if (!user) return;

    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.emit('join', user.id);

    socket.on('newMessage', (message) => {
      addMessage(message.chatId, message);
    });

    socket.on('messageSent', (message) => {
      addMessage(message.chatId, message);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, addMessage]);

  const sendMessage = (receiverId: string, content: string, contentType: string = 'text') => {
    if (socketRef.current && user) {
      socketRef.current.emit('sendMessage', {
        senderId: user.id,
        receiverId,
        content,
        contentType
      });
    }
  };

  return { sendMessage };
};
