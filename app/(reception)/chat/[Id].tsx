import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useUser } from '../../../context/UserContext';
import ChatHeader from '../../../components/Chat/ChatHeader';
import MessageBubble from '../../../components/Chat/MessageBubble';
import ChatInput from '../../../components/Chat/ChatInput';
import { useChat } from '../../../hooks/useChat';

export default function ReceptionChatDetailScreen() {
  const { id, otherUserId, otherUserName, userType } = useLocalSearchParams();
  const { user } = useUser();

  const [info] = useState({
    name: otherUserName || 'User',
    isOnline: false, // optional if not provided
    type: userType || 'patient',
  });

  /** 
   * 🔥 unify ALL socket, upload, retry logic inside useChat
   */
  const {
    messages,
    loading,
    flatListRef,
    handleSendMessage,
    handleSendImage,
    handleSendFile,
    handleRetry,
    startTyping,
    stopTyping,
  } = useChat({
    chatId: id as string,
    currentUserId: user?.id,
    currentUserType: 'reception',
  });

  const handleTyping = (isTyping: boolean) => {
    if (isTyping) startTyping();
    else stopTyping();
  };

  const handleInfoPress = () => {
    Alert.alert(
      'User Info',
      `Name: ${info.name}\nType: ${info.type}\nUser ID: ${otherUserId}`
    );
  };

  const renderMessage = ({ item }: any) => (
    <MessageBubble
      message={{
        ...item,
        onRetry: handleRetry,
      }}
      isOwn={item.senderId === user?.id}
      onPressImage={(msg) => console.log("Open Image Viewer", msg)}
      onPressFile={(msg) => console.log("Open File", msg)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 🔥 Reusable unified header */}
      <ChatHeader
        name={info.name}
        isOnline={info.isOnline}
        userType={info.type}
        onInfoPress={handleInfoPress}
      />

      {/* 🔥 Reusable chat list */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* 🔥 Unified ChatInput (image, file, text, typing) */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendImage={handleSendImage}
        onSendFile={handleSendFile}
        onTyping={handleTyping}
        placeholder="Message receptionist..."
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 10,
  },
});
