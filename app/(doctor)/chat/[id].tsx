import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '../../../context/UserContext';
import ChatHeader from '../../../components/Chat/ChatHeader';
import ChatInput from '../../../components/Chat/ChatInput';
import MessageBubble from '../../../components/Chat/MessageBubble';
import { useChat } from '../../../hooks/useChat';

export default function DoctorChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const [patientInfo, setPatientInfo] = useState({
    name: 'Patient',
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
  } = useChat({
    chatId: id as string,
    currentUserId: user?.id || 0,
    currentUserType: 'doctor',
  });

  const handleTyping = (isTyping: boolean) => {
    if (isTyping) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleInfoPress = () => {
    Alert.alert('Patient Info', `View patient details`);
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
        name={patientInfo.name}
        isOnline={patientInfo.isOnline}
        userType="patient"
        onInfoPress={handleInfoPress}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id || item.id?.toString() || ''}
        contentContainerStyle={styles.messagesList}
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