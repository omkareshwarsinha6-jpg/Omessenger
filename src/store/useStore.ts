import { create } from 'zustand';
import { User, Message } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  chats: any[];
  activeChatId: string | null;
  messages: Record<string, Message[]>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setChats: (chats: any[]) => void;
  setActiveChatId: (id: string | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  chats: [],
  activeChatId: null,
  messages: {},
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },
  setChats: (chats) => set({ chats }),
  setActiveChatId: (activeChatId) => set({ activeChatId }),
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message]
    }
  })),
  setMessages: (chatId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: messages
    }
  })),
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, chats: [], activeChatId: null, messages: {} });
  }
}));
