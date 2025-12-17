import { API_ENDPOINTS } from '../config/api.config';
import * as SecureStore from 'expo-secure-store';

/**
 * Get authentication token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('userToken');
  } catch {
    return null;
  }
}

/**
 * Upload a file via REST API
 * Files are stored on server and accessible via URLs
 */
export async function uploadFile(
  chatId: string | number,
  file: any,
  optionalMessage: string = ''
): Promise<any> {
  if (!chatId) {
    throw new Error('chatId is required');
  }
  if (!file || !file.uri) {
    throw new Error('file is required');
  }

  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication token required');
  }

  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append('chatId', chatId.toString());

  // Append file
  formData.append('file', {
    uri: file.uri,
    name: file.fileName || file.name || 'file',
    type: file.mimeType || file.type || 'application/octet-stream',
  } as any);

  if (optionalMessage && optionalMessage.trim()) {
    formData.append('body', optionalMessage.trim());
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.CHATS.FILE_UPLOAD}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - let the browser set it
      },
      body: formData,
    });

    const data = await response.json();
    console.log('File upload response:', data);
    if (!response.ok || data.success === false) {
      const errorMsg = data.error || data.message || `HTTP ${response.status}`;
      
      switch (response.status) {
        case 400:
          throw new Error(`Bad Request: ${errorMsg}`);
        case 401:
          throw new Error('Unauthorized: Please log in again');
        case 404:
          throw new Error('Chat not found');
        case 413:
          throw new Error('File too large. Maximum size is 50MB');
        case 500:
          throw new Error('Upload failed: Server error');
        default:
          throw new Error(errorMsg);
      }
    }

    if (data.success && data.message) {
      return data.message;
    }

    throw new Error(data.error || 'Upload failed');
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to server');
    }
    throw error;
  }
}

/**
 * Get full URL for a file from server
 */
export function getFileUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  
  // If already a full URL, return as-is
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  
  // If data URI or local file, return as-is
  if (fileUrl.startsWith('data:') || fileUrl.startsWith('file://')) {
    return fileUrl;
  }
  
  // Construct full URL
  const baseUrl = 'http://72.60.221.85:5000'; // Your backend URL
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${baseUrl}${path}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number = 0): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file metadata from message
 */
export function getFileMetadata(message: any) {
  return {
    fileName: message.file?.fileName || message.fileName || 'File',
    fileSize: message.file?.fileSize || message.fileSize || 0,
    mimeType: message.file?.mimeType || message.mimeType || 'application/octet-stream',
    fileUrl: message.file?.fileUrl || message.fileUrl || '',
  };
}