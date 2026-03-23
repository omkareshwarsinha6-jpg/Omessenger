import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Shield, 
  LogOut, 
  Search, 
  Plus, 
  Send, 
  Paperclip, 
  Mic, 
  MoreVertical, 
  ArrowLeft,
  Check,
  CheckCheck
} from 'lucide-react';
import { format } from 'date-fns';

// --- Components ---

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F1A] text-white">
    <motion.div
      animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
    />
    <h1 className="text-2xl font-bold tracking-tight">OmessengeR Pro</h1>
    <p className="text-slate-400 mt-2">Initializing secure connection...</p>
  </div>
);

const AuthPage = ({ onLogin }: { onLogin: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F1A] p-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-[#111827] rounded-2xl p-8 border border-white/5 shadow-2xl"
    >
      <div className="flex items-center justify-center mb-8">
        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <MessageSquare className="text-white w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white ml-3">OmessengeR Pro</h1>
      </div>
      
      <h2 className="text-xl font-semibold text-white mb-2 text-center">Welcome Back</h2>
      <p className="text-slate-400 text-center mb-8">Securely connect with your global network.</p>
      
      <button
        onClick={onLogin}
        className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-slate-100 transition-all active:scale-95"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        Continue with Google
      </button>
      
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">End-to-End Encrypted</p>
      </div>
    </motion.div>
  </div>
);

const ChatList = ({ chats, activeChatId, onSelectChat, currentUserId }: any) => (
  <div className="flex-1 overflow-y-auto scrollbar-hide">
    {chats.map((chat: any) => {
      const otherParticipant = chat.participants.find((p: string) => p !== currentUserId);
      const isActive = activeChatId === chat.chatId;
      
      return (
        <motion.div
          key={chat.chatId}
          whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
          onClick={() => onSelectChat(chat.chatId)}
          className={`flex items-center p-4 cursor-pointer border-b border-white/5 transition-colors ${isActive ? 'bg-white/5' : ''}`}
        >
          <div className="relative">
            <div className="w-12 h-12 bg-slate-700 rounded-full overflow-hidden">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant}`} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#111827] rounded-full"></div>
          </div>
          
          <div className="ml-4 flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-white font-medium truncate">User {otherParticipant?.slice(0, 8)}</h3>
              <span className="text-xs text-slate-500">
                {chat.lastMessageTimestamp ? format(chat.lastMessageTimestamp.toDate(), 'HH:mm') : ''}
              </span>
            </div>
            <p className="text-sm text-slate-400 truncate">{chat.lastMessage || 'No messages yet'}</p>
          </div>
          
          {chat.unreadCount?.[currentUserId] > 0 && (
            <div className="ml-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{chat.unreadCount[currentUserId]}</span>
            </div>
          )}
        </motion.div>
      );
    })}
  </div>
);

const ChatWindow = ({ activeChatId, messages, onSendMessage, currentUserId, onBack }: any) => {
  const [input, setInput] = useState('');
  const otherUserId = activeChatId?.split('_').find((p: string) => p !== currentUserId);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(otherUserId, input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F1A]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#111827] border-b border-white/5">
        <div className="flex items-center">
          <button onClick={onBack} className="md:hidden mr-4 text-slate-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 bg-slate-700 rounded-full overflow-hidden">
             <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
              />
          </div>
          <div className="ml-3">
            <h3 className="text-white font-medium">User {otherUserId?.slice(0, 8)}</h3>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <Search className="w-5 h-5 cursor-pointer hover:text-white" />
          <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg: any) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.messageId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl ${
                isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-[#1F2937] text-white rounded-tl-none'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] opacity-60">
                    {format(msg.timestamp.toDate(), 'HH:mm')}
                  </span>
                  {isMe && (
                    msg.isRead ? <CheckCheck className="w-3 h-3 text-cyan-400" /> : <Check className="w-3 h-3 opacity-60" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-[#111827] border-t border-white/5">
        <div className="flex items-center gap-3 bg-[#1F2937] rounded-2xl p-2">
          <button className="p-2 text-slate-400 hover:text-white">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm"
          />
          {input.trim() ? (
            <button 
              onClick={handleSend}
              className="p-2 bg-purple-600 rounded-xl text-white hover:bg-purple-700 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button className="p-2 text-slate-400 hover:text-white">
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const { chats, messages, activeChatId, setActiveChatId, sendMessage } = useChat(user?.uid);
  const [view, setView] = useState<'chats' | 'contacts' | 'settings' | 'admin'>('chats');

  if (authLoading) return <LoadingScreen />;

  if (!user) return <AuthPage onLogin={loginWithGoogle} />;

  if (user.isBanned) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F1A] text-white p-6 text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Account Banned</h1>
        <p className="text-slate-400 mb-6">Your account has been suspended for: {user.banReason || 'Policy violations'}</p>
        <button onClick={logout} className="px-6 py-2 bg-slate-800 rounded-lg">Logout</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0B0F1A] text-white overflow-hidden">
      {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-20 bg-[#111827] border-r border-white/5 items-center py-8 gap-8">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
            <MessageSquare className="text-white w-6 h-6" />
          </div>
          
          <div className="flex flex-col gap-6 flex-1">
            <button onClick={() => setView('chats')} className={`p-3 rounded-xl transition-all ${view === 'chats' ? 'bg-purple-500/10 text-purple-500' : 'text-slate-500 hover:text-white'}`}>
              <MessageSquare className="w-6 h-6" />
            </button>
            <button onClick={() => setView('contacts')} className={`p-3 rounded-xl transition-all ${view === 'contacts' ? 'bg-purple-500/10 text-purple-500' : 'text-slate-500 hover:text-white'}`}>
              <Users className="w-6 h-6" />
            </button>
            <button onClick={() => setView('settings')} className={`p-3 rounded-xl transition-all ${view === 'settings' ? 'bg-purple-500/10 text-purple-500' : 'text-slate-500 hover:text-white'}`}>
              <Settings className="w-6 h-6" />
            </button>
            {user.isAdmin && (
              <button onClick={() => setView('admin')} className={`p-3 rounded-xl transition-all ${view === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'text-slate-500 hover:text-white'}`}>
                <Shield className="w-6 h-6" />
              </button>
            )}
          </div>

          <button onClick={logout} className="p-3 text-slate-500 hover:text-red-400 transition-colors">
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* List Section */}
          <div className={`w-full md:w-80 flex-col bg-[#0B0F1A] border-r border-white/5 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Chats</h1>
                <button className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search messages..." 
                  className="w-full bg-[#111827] border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <ChatList 
              chats={chats} 
              activeChatId={activeChatId} 
              onSelectChat={setActiveChatId} 
              currentUserId={user.uid} 
            />
          </div>

          {/* Chat Section */}
          <div className={`flex-1 ${!activeChatId ? 'hidden md:flex' : 'flex'} flex-col`}>
            {activeChatId ? (
              <ChatWindow 
                activeChatId={activeChatId}
                messages={messages}
                onSendMessage={sendMessage}
                currentUserId={user.uid}
                onBack={() => setActiveChatId(null)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F1A] text-slate-500">
                <div className="w-20 h-20 bg-[#111827] rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-medium text-white mb-2">Select a chat to start messaging</h2>
                <p className="text-sm">Your messages are end-to-end encrypted.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#111827] border-t border-white/5 flex items-center justify-around px-6">
          <button onClick={() => setView('chats')} className={`p-2 ${view === 'chats' ? 'text-purple-500' : 'text-slate-500'}`}>
            <MessageSquare className="w-6 h-6" />
          </button>
          <button onClick={() => setView('contacts')} className={`p-2 ${view === 'contacts' ? 'text-purple-500' : 'text-slate-500'}`}>
            <Users className="w-6 h-6" />
          </button>
          <button onClick={() => setView('settings')} className={`p-2 ${view === 'settings' ? 'text-purple-500' : 'text-slate-500'}`}>
            <Settings className="w-6 h-6" />
          </button>
          {user.isAdmin && (
            <button onClick={() => setView('admin')} className={`p-2 ${view === 'admin' ? 'text-purple-500' : 'text-slate-500'}`}>
              <Shield className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
  );
}
