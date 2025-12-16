import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '../../../context/UserContext';
import ChatHeader from '../../../components/Chat/ChatHeader';
import ChatInput from '../../../components/Chat/ChatInput';
import MessageBubble from '../../../components/Chat/MessageBubble';
import TypingIndicator from '../../../components/Chat/TypingIndicator';
import { useChat } from '../../../hooks/useChat';

export default function PatientChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const [doctorInfo, setDoctorInfo] = useState({
    name: 'Doctor',
    isOnline: false,
  });

  const {
    messages,
    loading,
    flatListRef,
    handleSendMessage,
    handleSendFile,
    handleRetry,
    startTyping,
    stopTyping,
    otherUserTyping,
  } = useChat({
    chatId: id as string,
    currentUserId: user?.id || 0,
    currentUserType: 'patient',
  });

  const handleTyping = (isTyping: boolean) => {
    if (isTyping) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <MessageBubble
      message={item}
      isOwn={item.senderId === user?.id}
      onRetry={handleRetry}
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
      <ChatHeader
        name={doctorInfo.name}
        isOnline={doctorInfo.isOnline}
        userType="doctor"
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id || item.id?.toString() || ''}
        contentContainerStyle={styles.messagesList}
        ListFooterComponent={
          <TypingIndicator 
            show={otherUserTyping} 
            userName={doctorInfo.name} 
          />
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

      <ChatInput
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onTyping={handleTyping}
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