import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getFileUrl } from '../../api/files';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  onPressImage?: (message: any) => void;
  onPressFile?: (message: any) => void;
  onRetry?: (message: any) => void;
}

function formatFileSize(bytes: number = 0): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType?: string): string {
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
  
  return '📎';
}

function MessageStatus({ status, isOwn }: { status?: string; isOwn: boolean }) {
  if (!isOwn || !status || status === 'delivered') return null;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return '○';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '!';
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sending':
        return '#9ca3af';
      case 'sent':
      case 'delivered':
        return '#d1d5db';
      case 'read':
        return '#2196F3';
      case 'failed':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const icon = getStatusIcon();
  if (!icon) return null;

  return (
    <Text style={{ 
      color: getStatusColor(), 
      fontSize: 12, 
      marginLeft: 4,
      fontWeight: status === 'read' ? '600' : '400'
    }}>
      {icon}
    </Text>
  );
}

export default function MessageBubble({ 
  message, 
  isOwn, 
  onPressImage, 
  onPressFile,
  onRetry 
}: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = () => {
    // Image message
    if (message.messageType === 'image') {
      let imageUri = message.imageUri || message.imageUrl;

if (message.file?.fileUrl) {
  imageUri = getFileUrl(message.file.fileUrl);
}

// Normalize any leftover relative paths
if (imageUri && !imageUri.startsWith('http') && !imageUri.startsWith('file://')) {
  imageUri = getFileUrl(imageUri);
}
      return (
        <View>
          {imageUri ? (
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => onPressImage?.(message)}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.messageImage}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons 
                name="image-outline" 
                size={40} 
                color={isOwn ? 'rgba(255,255,255,0.5)' : '#9ca3af'} 
              />
              <Text style={[
                styles.placeholderText,
                { color: isOwn ? 'rgba(255,255,255,0.7)' : '#6b7280' }
              ]}>
                Image
              </Text>
            </View>
          )}
          {message.body && (
            <Text style={[
              styles.messageText,
              { color: isOwn ? '#fff' : '#333', marginTop: 8 }
            ]}>
              {message.body}
            </Text>
          )}
        </View>
      );
    }

    // File message
    if (message.messageType === 'file' || message.hasFile) {
      const fileName = message.file?.fileName || message.fileName || message.body || 'File';
      const fileSize = message.file?.fileSize || message.fileSize;
      const mimeType = message.file?.mimeType || message.mimeType;
      const fileIcon = getFileIcon(mimeType);

      return (
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => onPressFile?.(message)}
          style={[
            styles.fileContainer,
            { backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
        >
          <View style={[
            styles.fileIconContainer,
            { backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }
          ]}>
            <Text style={styles.fileIcon}>{fileIcon}</Text>
          </View>
          <View style={styles.fileInfo}>
            <Text 
              style={[
                styles.fileName,
                { color: isOwn ? '#fff' : '#333' }
              ]} 
              numberOfLines={2}
            >
              {fileName}
            </Text>
            {fileSize && (
              <Text style={[
                styles.fileSize,
                { color: isOwn ? 'rgba(255,255,255,0.7)' : '#6b7280' }
              ]}>
                {formatFileSize(fileSize)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    // Text message
    return (
      <Text style={[
        styles.messageText,
        { color: isOwn ? '#fff' : '#333' }
      ]}>
        {message.body}
      </Text>
    );
  };

  return (
    <View style={[
      styles.container,
      { alignItems: isOwn ? 'flex-end' : 'flex-start' }
    ]}>
      <View style={[
        styles.bubble,
        {
          backgroundColor: isOwn ? '#2196F3' : '#f3f4f6',
          borderBottomRightRadius: isOwn ? 4 : 18,
          borderBottomLeftRadius: isOwn ? 18 : 4,
        }
      ]}>
        {message.status === 'sending' && (
          <View style={styles.sendingOverlay}>
            <ActivityIndicator size="small" color={isOwn ? '#fff' : '#2196F3'} />
          </View>
        )}
        
        {renderContent()}
        
        <View style={styles.metadata}>
          <Text style={[
            styles.timestamp,
            { color: isOwn ? 'rgba(255,255,255,0.7)' : '#9ca3af' }
          ]}>
            {formatTime(message.timestamp || new Date().toISOString())}
          </Text>
          <MessageStatus status={message.status} isOwn={isOwn} />
        </View>

        {message.status === 'failed' && (
          <View style={styles.failedContainer}>
            <Text style={styles.failedText}>⚠️ Failed to send</Text>
            {onRetry && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => onRetry(message)}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    position: 'relative',
  },
  sendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageImage: {
    width: 240,
    height: 240,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  placeholderText: {
    fontSize: 13,
    marginTop: 8,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 24,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
  },
  failedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 8,
  },
  failedText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});