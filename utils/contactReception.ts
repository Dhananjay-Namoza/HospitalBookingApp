import { router } from 'expo-router';
import ApiService from '../services/api.service';

const RECEPTION_USER_ID = 201; // Reception user ID as specified

export async function contactReception(currentUser: any) {
  try {
    // Check if chat with reception already exists
    const chatsResponse = await ApiService.getChats();
    
    if (chatsResponse.success && chatsResponse.chats) {
      // Look for existing chat with reception
      const receptionChat = chatsResponse.chats.find(
        (chat: any) => chat.otherUser?._id === RECEPTION_USER_ID || 
                       chat.otherUser?.id === RECEPTION_USER_ID
      );
      
      if (receptionChat) {
        // Navigate to existing chat
        navigateToReceptionChat(currentUser.type, receptionChat.chatId);
        return;
      }
    }
    
    // Create new chat with reception
    const createResponse = await ApiService.createChat({
      otherUserId: RECEPTION_USER_ID,
    });
    
    if (createResponse.success && createResponse.chat) {
      navigateToReceptionChat(currentUser.type, createResponse.chat.chatId);
    } else {
      throw new Error('Failed to create chat with reception');
    }
    
  } catch (error) {
    console.error('Error contacting reception:', error);
    throw error;
  }
}

/**
 * Navigate to reception chat based on user type
 */
function navigateToReceptionChat(userType: 'patient' | 'doctor', chatId: string) {
  if (userType === 'patient') {
    router.push({
      pathname: '/(patient)/chat/[id]',
      params: { 
        id: chatId,
        otherUserId: RECEPTION_USER_ID,
        otherUserName: 'Reception',
        userType: 'reception'
      }
    });
  } else if (userType === 'doctor') {
    router.push({
      pathname: '/(doctor)/chat/[id]',
      params: { 
        id: chatId,
        otherUserId: RECEPTION_USER_ID,
        otherUserName: 'Reception',
        userType: 'reception'
      }
    });
  }
}

/**
 * Check if a chat is with reception
 */
export function isReceptionChat(chat: any): boolean {
  return chat.otherUser?._id === RECEPTION_USER_ID || 
         chat.otherUser?.id === RECEPTION_USER_ID;
}

/**
 * Sort chats to put reception chat at the top
 */
export function sortChatsWithReceptionFirst(chats: any[]): any[] {
  return [...chats].sort((a, b) => {
    const aIsReception = isReceptionChat(a);
    const bIsReception = isReceptionChat(b);
    
    if (aIsReception && !bIsReception) return -1;
    if (!aIsReception && bIsReception) return 1;
    
    // Sort by last message time for non-reception chats
    const aTime = new Date(a.lastMessageAt || 0).getTime();
    const bTime = new Date(b.lastMessageAt || 0).getTime();
    return bTime - aTime;
  });
}