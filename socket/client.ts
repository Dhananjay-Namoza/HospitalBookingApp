import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_BASE_URL = 'http://72.60.221.85:5000'; // Your backend URL
const SOCKET_PATH = '/socket.io';

let socket: Socket | null = null;
let boundToken: string | null = null;

/**
 * Get JWT token from secure storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('userToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Connect to Socket.IO server using JWT authentication
 */
export async function connectSocket(token?: string): Promise<Socket> {
  // Get token from storage if not provided
  if (!token) {
    token = await getAuthToken();
  }
  
  if (!token) {
    throw new Error('JWT token required for socket connection');
  }
  
  // Return existing connection if same token
  if (socket && socket.connected && boundToken === token) {
    console.log('Using existing socket connection');
    return socket;
  }

  // Disconnect existing socket if different token
  if (socket) {
    console.log('Disconnecting old socket');
    try { 
      socket.disconnect(); 
    } catch (e) {
      console.error('Error disconnecting socket:', e);
    }
    socket = null;
  }

  // Create new socket connection
  console.log('Creating new socket connection...');
  socket = io(SOCKET_BASE_URL, {
    path: SOCKET_PATH,
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  boundToken = token;

  // Connection event listeners
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error.message);
  });

  return socket;
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket(): void {
  if (socket) {
    console.log('Disconnecting socket...');
    try { 
      socket.disconnect(); 
    } catch (e) {
      console.error('Error disconnecting socket:', e);
    }
    socket = null;
    boundToken = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

/**
 * Reconnect socket with current or new token
 */
export async function reconnectSocket(token?: string): Promise<Socket> {
  disconnectSocket();
  return await connectSocket(token);
}