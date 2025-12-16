import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ActionSheetIOS,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendFile?: (file: any, type: 'image' | 'file') => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  onSendFile,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (text: string) => {
    setMessage(text);

    // Notify typing
    if (onTyping && text.trim()) {
      onTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending || disabled) return;

    setSending(true);
    
    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
      setInputHeight(40);
      
      if (onTyping) {
        onTyping(false);
      }
      
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = () => {
    if (!onSendFile) {
      Alert.alert('Feature unavailable', 'File sharing is not available in this chat');
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose Photo', 'Choose File'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) openCamera();
          else if (buttonIndex === 2) pickImage();
          else if (buttonIndex === 3) pickDocument();
        }
      );
    } else {
      Alert.alert('Send File', 'Choose file type', [
        { text: 'Take Photo', onPress: openCamera },
        { text: 'Choose Photo', onPress: pickImage },
        { text: 'Choose File', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0] && onSendFile) {
        const file = result.assets[0];
        onSendFile({
          uri: file.uri,
          name: `photo_${Date.now()}.jpg`,
          fileName: `photo_${Date.now()}.jpg`,
          type: file.type || 'image/jpeg',
          mimeType: file.type || 'image/jpeg',
          fileSize: file.fileSize,
        }, 'image');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0] && onSendFile) {
        const file = result.assets[0];
        onSendFile({
          uri: file.uri,
          name: file.fileName || `image_${Date.now()}.jpg`,
          fileName: file.fileName || `image_${Date.now()}.jpg`,
          type: file.type || 'image/jpeg',
          mimeType: file.type || 'image/jpeg',
          fileSize: file.fileSize,
        }, 'image');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0] && onSendFile) {
        const file = result.assets[0];
        onSendFile({
          uri: file.uri,
          name: file.name,
          fileName: file.name,
          type: file.mimeType || 'application/octet-stream',
          mimeType: file.mimeType || 'application/octet-stream',
          fileSize: file.size,
        }, 'file');
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  return (
    <View style={styles.container}>
      {onSendFile && (
        <TouchableOpacity
          style={[styles.attachButton, disabled && styles.buttonDisabled]}
          onPress={handleAttachment}
          disabled={disabled}
        >
          <Ionicons 
            name="add-circle" 
            size={28} 
            color={disabled ? '#ccc' : '#2196F3'} 
          />
        </TouchableOpacity>
      )}

      <TextInput
        style={[
          styles.input,
          { height: Math.max(40, Math.min(inputHeight, 100)) },
          disabled && styles.inputDisabled,
        ]}
        value={message}
        onChangeText={handleTextChange}
        onContentSizeChange={(e) => {
          setInputHeight(e.nativeEvent.contentSize.height);
        }}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline
        maxLength={1000}
        editable={!disabled && !sending}
        returnKeyType="default"
      />

      <TouchableOpacity
        style={[
          styles.sendButton,
          (!message.trim() || disabled || sending) && styles.buttonDisabled,
        ]}
        onPress={handleSend}
        disabled={!message.trim() || sending || disabled}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="send" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  attachButton: {
    padding: 4,
    marginBottom: 6,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});