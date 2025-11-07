import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllUserChats,
  loadChatMessages,
  sendAdminMessage,
} from '../Firebase/ChatAPI';

const AdminChatScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadChats();
    
    // Reload chats every 30 seconds
    const interval = setInterval(loadChats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadChats = async () => {
    setIsLoading(true);
    const result = await getAllUserChats();
    if (result.success) {
      setChats(result.data);
    }
    setIsLoading(false);
  };

  const handleChatPress = (chat) => {
    setSelectedChat(chat);
    setModalVisible(true);
    
    // Load messages
    const unsubscribe = loadChatMessages(chat.userId, setMessages);
    
    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendAdminMessage(selectedChat.userId, messageText);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.avatarContainer}>
                      <Ionicons name="person-circle" size={50} color="#000D66" />
        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.chatInfo}>
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.userEmail}>{item.userEmail}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {item.lastMessageTime?.toDate
            ? new Date(item.lastMessageTime.toDate()).toLocaleDateString('vi-VN')
            : ''}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isAdmin = item.sender === 'admin';
    const isBot = item.sender === 'bot';
    const isUser = item.sender === 'user';

    // Xác định màu sắc và icon dựa trên sender
    let iconName, iconColor, bubbleStyle, textStyle, labelText, labelStyle;
    
    if (isAdmin) {
      iconName = 'shield-checkmark';
      iconColor = '#000D66';
      bubbleStyle = styles.adminBubble;
      textStyle = styles.adminMessageText;
      labelText = 'Admin';
      labelStyle = styles.adminLabel;
    } else if (isBot) {
      iconName = 'sparkles';
      iconColor = '#3B82F6';
      bubbleStyle = styles.botBubble;
      textStyle = styles.botMessageText;
      labelText = 'Bot AI';
      labelStyle = styles.botLabel;
    } else {
      iconName = 'person';
      iconColor = '#059669';
      bubbleStyle = styles.userBubble;
      textStyle = styles.userMessageText;
      labelText = 'Khách hàng';
      labelStyle = styles.userLabel;
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isAdmin ? styles.adminMessageContainer : styles.userMessageContainer,
        ]}
      >
        {/* Icon bên trái (User & Bot) */}
        {!isAdmin && (
          <View style={styles.senderIconContainer}>
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>
        )}

        <View style={{ maxWidth: '75%' }}>
          {/* Label hiển thị vai trò */}
          <View style={[styles.senderLabel, labelStyle]}>
            <Ionicons name={iconName} size={12} color={iconColor} />
            <Text style={[styles.senderLabelText, { color: iconColor }]}>
              {labelText}
            </Text>
          </View>

          {/* Bong bóng tin nhắn */}
          <View style={[styles.messageBubble, bubbleStyle]}>
            <Text style={[styles.messageText, textStyle]}>
              {item.text}
            </Text>
            <Text style={[
              styles.timestamp,
              isAdmin && styles.adminTimestamp
            ]}>
              {item.timestamp?.toDate
                ? new Date(item.timestamp.toDate()).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </Text>
          </View>
        </View>

        {/* Icon bên phải (Admin) */}
        {isAdmin && (
          <View style={styles.senderIconContainer}>
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Chat</Text>
        <TouchableOpacity onPress={loadChats}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000D66" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.chatList}
        />
      )}

      {/* Chat Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalHeaderTitle}>
                {selectedChat?.userName}
              </Text>
              <Text style={styles.modalHeaderSubtitle}>
                {selectedChat?.userEmail}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Messages */}
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `${item.id || index}`}
            contentContainerStyle={styles.messagesList}
            inverted={false}
          />

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#999"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isSending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#000D66', // Navy Blue (main color)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000D66', // Navy Blue
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    color: '#6B7280',
  },
  chatList: {
    paddingVertical: 10,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444', // Bright red
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937', // Dark gray
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280', // Medium gray
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
    color: '#9CA3AF', // Light gray
  },
  timeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#000D66', // Navy Blue (main color)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeaderInfo: {
    flex: 1,
    marginLeft: 15,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalHeaderSubtitle: {
    fontSize: 13,
    color: '#E0E7FF', // Light navy
    marginTop: 2,
  },
  headerSpacer: {
    width: 34,
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  adminMessageContainer: {
    justifyContent: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-start',
  },
  senderIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  senderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  userLabel: {
    backgroundColor: '#ECFDF5',
  },
  botLabel: {
    backgroundColor: '#EFF6FF',
  },
  adminLabel: {
    backgroundColor: '#EDE9FE',
    alignSelf: 'flex-end',
  },
  senderLabelText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  adminBubble: {
    backgroundColor: '#000D66',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  userBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  adminMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#1F2937',
  },
  userMessageText: {
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
    color: '#D1D5DB',
  },
  adminTimestamp: {
    color: '#fff',
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1.5,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F3F4F6', // Light gray
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: '#1F2937',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000D66', // Navy Blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000D66',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF', // Gray when disabled
    opacity: 0.6,
  },
});

export default AdminChatScreen;
