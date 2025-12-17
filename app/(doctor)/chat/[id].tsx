import React, { useState,useCallback,useMemo } from 'react';
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
import { getFileUrl } from "../../../api/files";
import ImageViewing from "react-native-image-viewing";
import { openFileInDefaultApp } from "../../../utils/openFile";
import * as FS from "expo-file-system/legacy";
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDayHeader } from '../../../utils/datetime';
export default function DoctorChatScreen() {
  const { id, chat } = useLocalSearchParams();
  const { user } = useUser();
  const parsedChat = JSON.parse(chat);
  const [patientInfo, setPatientInfo] = useState({
    name: parsedChat?.otherUser?.name || 'Patient',
    isOnline: parsedChat?.otherUser?.isOnline || false,
  });
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
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
  const imageItems = messages
  .filter(m => m.messageType === "image")
  .map(m => {
    let uri = m.imageUri || m.imageUrl || m.file?.fileUrl;
    if (uri) uri = getFileUrl(uri);
    return { uri };
  });
  const handleTyping = (isTyping: boolean) => {
    if (isTyping) {
      startTyping();
    } else {
      stopTyping();
    }
  };
    const sections = useMemo(() => {
    const sorted = [...messages].sort(
      (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
    );
    const groups = new Map();
    for (const m of sorted) {
      const d = new Date(m.timestamp || Date.now());
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (!groups.has(key)) groups.set(key, { key, title: formatDayHeader(d), data: [] });
      groups.get(key).data.push(m);
    }
    return Array.from(groups.values()).sort((a, b) => a.key - b.key);
  }, [messages]);
 const scrollToBottom = useCallback((animated = true) => {
    if (!listRef.current) return;
    try {
      if (typeof listRef.current.scrollToEnd === 'function') {
        listRef.current.scrollToEnd({ animated });
        return;
      }
    } catch {}

    if (!sections.length) return;
    const sIdx = sections.length - 1;
    const iIdx = Math.max(0, sections[sIdx]?.data?.length - 1 || 0);
    try {
      listRef.current?.scrollToLocation?.({
        sectionIndex: sIdx,
        itemIndex: iIdx+1,
        animated,
        viewPosition: 1,
      });
    } catch (err) {
      console.warn('scrollToBottom failed:', err?.message);
    }
  }, [sections]);
  const handleInfoPress = () => {
    Alert.alert('User Info', `Name: ${patientInfo.name}\nOnline: ${patientInfo.isOnline ? 'Yes' : 'No'}`);
  };
  const handleFilePress = async (msg: any) => {
  try {
    let uri = msg.fileUri;

    // If not cached locally, download it
    if (!uri) {
      const remote = msg.file?.fileUrl || msg.fileUrl;
      if (!remote) {
        Alert.alert("Error", "File URL missing");
        return;
      }

      const fullUrl = getFileUrl(remote);
      const fileName = msg.file?.fileName || "file";
      const filePath = `${FS.cacheDirectory}${fileName}`;

      const res = await FS.downloadAsync(fullUrl, filePath);

      if (res.status !== 200) {
        Alert.alert("Download error", "Unable to download file");
        return;
      }

      uri = res.uri;
    }

    const mimeType = msg.file?.mimeType || msg.mimeType || undefined;

    await openFileInDefaultApp({ uri, mimeType });

  } catch (e: any) {
    Alert.alert("Open failed", e?.message || "Unable to open file");
  }
};
  const renderMessage = ({ item }: { item: any }) => (
    <MessageBubble
      message={item}
      isOwn={item.senderId === user?.id}
      onRetry={handleRetry}
      onPressImage={() => {
      const index = imageItems.findIndex(
        img => img.uri === getFileUrl(item.file?.fileUrl)
      );
      setLightboxIndex(index >= 0 ? index : 0);
      setLightboxVisible(true);
    }}
     onPressFile={() => handleFilePress(item)} 
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
      <SafeAreaView style={styles.container}>
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
        onContentSizeChange={() => flatListRef?.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

      <ChatInput
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onTyping={handleTyping}
      />
      <ImageViewing
  images={imageItems}
  imageIndex={lightboxIndex}
  visible={lightboxVisible}
  onRequestClose={() => setLightboxVisible(false)}
/>
</SafeAreaView>
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