import { getSocket } from './client';
import * as FileSystem from 'expo-file-system';

const OUTBOX_DIR = `${FileSystem.cacheDirectory}hospital_outbox`;
const OUTBOX_PATH = `${OUTBOX_DIR}/outbox.json`;

let outboxLoaded = false;
let outboxQueue: any[] = [];

/**
 * Ensure outbox directory exists
 */
async function ensureOutboxDir() {
  try {
    // Check if directory exists using the new API
    const dirExists = await FileSystem.StorageAccessFramework.readDirectoryAsync(OUTBOX_DIR)
      .then(() => true)
      .catch(() => false);
    
    if (!dirExists) {
      await FileSystem.makeDirectoryAsync(OUTBOX_DIR, { intermediates: true });
    }
  } catch (error) {
    // If the above doesn't work, try the simpler approach
    try {
      await FileSystem.makeDirectoryAsync(OUTBOX_DIR, { intermediates: true });
    } catch (mkdirError) {
      // Directory might already exist, which is fine
      console.error('Error ensuring outbox directory:', error);
    }
  }
}

/**
 * Load queued messages from disk
 */
async function loadOutbox() {
  if (outboxLoaded) return;
  outboxLoaded = true;
  
  try {
    // Check if file exists by trying to read it
    try {
      const json = await FileSystem.readAsStringAsync(OUTBOX_PATH);
      outboxQueue = JSON.parse(json || '[]');
      console.log(`Loaded ${outboxQueue.length} messages from outbox`);
    } catch (readError) {
      // File doesn't exist or is unreadable
      outboxQueue = [];
    }
  } catch (error) {
    console.error('Error loading outbox:', error);
    outboxQueue = [];
  }
}

/**
 * Persist outbox to disk
 */
async function persistOutbox() {
  try {
    await ensureOutboxDir();
    await FileSystem.writeAsStringAsync(OUTBOX_PATH, JSON.stringify(outboxQueue));
  } catch (error) {
    console.error('Error persisting outbox:', error);
  }
}

/**
 * Add message to outbox queue
 */
async function enqueueOutbox(payload: any) {
  await loadOutbox();
  outboxQueue.push({
    id: `outbox-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    payload,
    timestamp: new Date().toISOString(),
  });
  await persistOutbox();
}

/**
 * Send all queued messages
 */
export async function flushOutbox() {
  try {
    const socket = getSocket();
    if (!socket?.connected) {
      console.log('Socket not connected, cannot flush outbox');
      return;
    }
    
    await loadOutbox();
    if (!outboxQueue.length) return;

    console.log(`Flushing ${outboxQueue.length} messages from outbox`);
    
    for (const item of outboxQueue) {
      try {
        socket.emit('send_message', item.payload);
      } catch (error) {
        console.error('Error sending queued message:', error);
      }
    }
    
    outboxQueue = [];
    await persistOutbox();
  } catch (error) {
    console.error('Error flushing outbox:', error);
  }
}

/**
 * Send a message via Socket.IO
 * If offline, queues the message for later delivery
 */
export async function sendMessage(data: {
  chatId: string;
  messageType: 'text' | 'image' | 'file';
  body?: string;
  fileData?: any;
}) {
  const socket = getSocket();
  
  const payload = {
    chatId: data.chatId,
    messageType: data.messageType,
    body: data.body || '',
    hasFile: !!data.fileData,
    ...(data.fileData && { file: data.fileData }),
  };

  if (socket?.connected) {
    try {
      socket.emit('send_message', payload);
      console.log('Message sent via socket');
      return;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
  
  // Queue message if socket not connected
  console.log('Socket not connected, queueing message');
  await enqueueOutbox(payload);
}

/**
 * Send typing indicator
 */
export function typingStart(chatId: string) {
  const socket = getSocket();
  socket?.emit('typing_start', { chatId });
}

/**
 * Stop typing indicator
 */
export function typingStop(chatId: string) {
  const socket = getSocket();
  socket?.emit('typing_stop', { chatId });
}

/**
 * Mark messages as read
 */
export function markMessagesRead(chatId: string) {
  const socket = getSocket();
  socket?.emit('mark_messages_read', { chatId });
}

// ============ Event Listeners ============

/**
 * Listen for successful message send
 */
export function onMessageSentSuccess(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.on('message_sent_success', callback);
  
  return () => {
    socket?.off('message_sent_success', callback);
  };
}

/**
 * Listen for message send errors
 */
export function onMessageSentError(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.on('message_sent_error', callback);
  
  return () => {
    socket?.off('message_sent_error', callback);
  };
}

/**
 * Listen for new incoming messages
 */
export function onNewMessage(callback: (message: any) => void) {
  const socket = getSocket();
  socket?.on('new_message', callback);
  
  return () => {
    socket?.off('new_message', callback);
  };
}

/**
 * Listen for typing indicators
 */
export function onUserTyping(callback: (data: { userId: string; isTyping: boolean; chatId: string }) => void) {
  const socket = getSocket();
  socket?.on('user_typing', callback);
  
  return () => {
    socket?.off('user_typing', callback);
  };
}

/**
 * Listen for read receipts
 */
export function onMessagesRead(callback: (data: { userId: string; chatId: string }) => void) {
  const socket = getSocket();
  socket?.on('messages_read', callback);
  
  return () => {
    socket?.off('messages_read', callback);
  };
}

/**
 * Bind socket lifecycle events
 */
export function bindSocketLifecycle() {
  const socket = getSocket();
  
  if (socket) {
    socket.on('connect', () => {
      console.log('Socket connected, flushing outbox...');
      flushOutbox().catch(console.error);
    });
    
    socket.on('reconnect', () => {
      console.log('Socket reconnected, flushing outbox...');
      flushOutbox().catch(console.error);
    });
  }
}