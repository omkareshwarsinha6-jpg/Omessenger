import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp, doc, setDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Message, Chat, OperationType } from '../types';
import { handleFirestoreError } from '../utils/error-handler';

export const useChat = (currentUserId: string | undefined) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Listen for user's chats
  useEffect(() => {
    if (!currentUserId) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUserId),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatList = snapshot.docs.map(doc => doc.data() as Chat);
      setChats(chatList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Listen for messages in active chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', activeChatId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map(doc => doc.data() as Message);
      setMessages(messageList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [activeChatId]);

  const sendMessage = async (receiverId: string, content: string, contentType: Message['contentType'] = 'text') => {
    if (!currentUserId) return;

    const participants = [currentUserId, receiverId].sort();
    const chatId = participants.join('_');

    const messageData: Message = {
      messageId: '', // Will be set after addDoc
      chatId,
      senderId: currentUserId,
      receiverId,
      content,
      contentType,
      timestamp: Timestamp.now(),
      participants,
      isRead: false,
    };

    try {
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      await setDoc(docRef, { messageId: docRef.id }, { merge: true });

      // Update chat metadata
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        chatId,
        participants,
        lastMessage: content,
        lastMessageTimestamp: Timestamp.now(),
      }, { merge: true });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    }
  };

  return { chats, messages, activeChatId, setActiveChatId, sendMessage, loading };
};
