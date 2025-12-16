export function formatFileSize(bytes: number = 0): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file icon emoji based on MIME type
 */
export function getFileIcon(mimeType?: string): string {
  if (!mimeType) return '📎';
  const type = mimeType.toLowerCase();
  
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
  if (type.includes('zip') || type.includes('compressed')) return '🗜️';
  if (type.includes('video')) return '🎬';
  if (type.includes('audio')) return '🎵';
  if (type.includes('text')) return '📃';
  if (type.includes('image')) return '🖼️';
  
  return '📎';
}

/**
 * Format timestamp for chat messages
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format last message timestamp
 */
export function formatLastMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get full file URL from server
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
  const baseUrl = 'http://72.60.221.85:5000';
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${baseUrl}${path}`;
}

/**
 * Validate file size (max 50MB)
 */
export function validateFileSize(fileSize: number): { valid: boolean; message?: string } {
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (fileSize > maxSize) {
    return {
      valid: false,
      message: `File size exceeds 50MB limit. Current size: ${formatFileSize(fileSize)}`
    };
  }
  
  return { valid: true };
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

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: any[]): { [date: string]: any[] } {
  const grouped: { [date: string]: any[] } = {};
  
  messages.forEach(message => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(message);
  });
  
  return grouped;
}

/**
 * Check if message is from today
 */
export function isMessageFromToday(timestamp: string): boolean {
  const messageDate = new Date(timestamp).toDateString();
  const today = new Date().toDateString();
  return messageDate === today;
}

/**
 * Sort chats by last message time
 */
export function sortChatsByTime(chats: any[]): any[] {
  return [...chats].sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || a.timestamp || 0).getTime();
    const bTime = new Date(b.lastMessageAt || b.timestamp || 0).getTime();
    return bTime - aTime;
  });
}

/**
 * Extract chat preview text
 */
export function getChatPreview(message: any): string {
  if (!message) return 'No messages yet';
  
  if (message.messageType === 'text') {
    return message.body || 'Message';
  } else if (message.messageType === 'image') {
    return '📷 Image';
  } else if (message.messageType === 'file') {
    return `📎 ${message.file?.fileName || 'File'}`;
  }
  
  return 'Message';
}

/**
 * Check if user is online (based on last seen)
 */
export function isUserOnline(lastSeen?: string, onlineThresholdMinutes = 5): boolean {
  if (!lastSeen) return false;
  
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
  
  return diffInMinutes <= onlineThresholdMinutes;
}

/**
 * Debounce function for typing indicators
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}