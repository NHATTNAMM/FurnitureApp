import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../Firebase/UserContext';
import {
  sendMessage,
  loadChatMessages,
  markMessagesAsRead,
  getChatbotResponse,
  deleteChatHistory,
  undoDeleteChatHistory,
  checkDeletedMessages,
  permanentlyDeleteAllMessages,
  recallMessage,
} from '../Firebase/ChatAPI';

const ChatBox = ({ visible, onClose }) => {
  const { user } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUndoButton, setShowUndoButton] = useState(false);
  const [undoInfo, setUndoInfo] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible && user?.id) {
      // Load chat history
      const unsubscribe = loadChatMessages(user.id, (loadedMessages) => {
        // Reverse messages so newest is at TOP (inverted list)
        setMessages([...loadedMessages].reverse());
      });
      
      // Mark messages as read when chat is opened
      markMessagesAsRead(user.id);
      
      // Check for deleted messages that can be restored
      checkDeletedMessages(user.id).then((result) => {
        if (result.hasDeleted && result.canRestore) {
          setShowUndoButton(true);
          setUndoInfo(result);
        } else {
          setShowUndoButton(false);
          setUndoInfo(null);
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else if (!visible) {
      // Reset when closing
      setMessages([]);
      setShowUndoButton(false);
      setUndoInfo(null);
    }
  }, [visible, user?.id]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setShowScrollButton(false);
  };

  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    // Show button when scrolled up more than 100px
    setShowScrollButton(contentOffset.y > 100);
  };

  const handleDeleteHistory = async () => {
    try {
      const result = await deleteChatHistory(user.id);
      if (result.success) {
        setMessages([]);
        setShowDeleteConfirm(false);
        setShowUndoButton(true);
        setUndoInfo({
          deletedAt: result.deletedAt,
          hoursRemaining: 24,
        });
        // Show success message from bot
        await sendMessage(user.id, {
          text: '🗑️ Lịch sử chat đã được xóa tạm thời.\n\n💡 Bạn có thể khôi phục lại trong vòng 24 giờ bằng nút "Hoàn tác" ở góc trên.',
          sender: 'bot',
          timestamp: new Date(),
          isRead: true,
        });
      }
    } catch (error) {
      console.error('Error deleting chat history:', error);
      alert('Có lỗi xảy ra khi xóa lịch sử. Vui lòng thử lại!');
    }
  };

  const handlePermanentDelete = async () => {
    try {
      const result = await permanentlyDeleteAllMessages(user.id);
      if (result.success) {
        setMessages([]);
        setShowDeleteConfirm(false);
        setShowUndoButton(false);
        setUndoInfo(null);
        // Show final message
        await sendMessage(user.id, {
          text: '🗑️ Lịch sử chat đã được xóa vĩnh viễn.\n\nBạn có thể bắt đầu cuộc trò chuyện mới! 👋',
          sender: 'bot',
          timestamp: new Date(),
          isRead: true,
        });
      }
    } catch (error) {
      console.error('Error permanently deleting chat history:', error);
      alert('Có lỗi xảy ra khi xóa lịch sử. Vui lòng thử lại!');
    }
  };

  const handleUndoDelete = async () => {
    try {
      const result = await undoDeleteChatHistory(user.id);
      if (result.success) {
        setShowUndoButton(false);
        setUndoInfo(null);
        // Show success message
        await sendMessage(user.id, {
          text: '✅ Khôi phục thành công!\n\nTất cả tin nhắn đã được khôi phục lại. 🎉',
          sender: 'bot',
          timestamp: new Date(),
          isRead: true,
        });
      }
    } catch (error) {
      console.error('Error undoing delete:', error);
      alert('Có lỗi xảy ra khi khôi phục. Vui lòng thử lại!');
    }
  };

  const handleLongPressMessage = (message) => {
    // Only allow recalling user's own messages
    if (message.sender === 'user' && !message.isRecalled) {
      setSelectedMessage(message);
      setShowMessageMenu(true);
    }
  };

  const handleRecallMessage = async () => {
    if (!selectedMessage || !user?.id) return;

    try {
      const result = await recallMessage(user.id, selectedMessage.id);
      if (result.success) {
        setShowMessageMenu(false);
        setSelectedMessage(null);
      } else {
        alert(result.error || 'Không thể thu hồi tin nhắn này');
        setShowMessageMenu(false);
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error recalling message:', error);
      alert('Có lỗi xảy ra khi thu hồi tin nhắn');
      setShowMessageMenu(false);
      setSelectedMessage(null);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user?.id) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Send user message
      await sendMessage(user.id, {
        text: userMessage,
        sender: 'user',
        timestamp: new Date(),
        isRead: true,
      });

      // Show bot typing indicator
      setIsBotTyping(true);

      // Get bot response
      const botResponse = await getChatbotResponse(userMessage, user.id);

      // Send bot response
      await sendMessage(user.id, {
        text: botResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        isRead: false,
        suggestions: botResponse.suggestions || [],
        actionType: botResponse.actionType || null,
        actionData: botResponse.actionData || null,
        source: botResponse.source || 'local', // Track response source
        confidence: botResponse.confidence || 0.9,
      });

      setIsBotTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsBotTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setInputText(suggestion);
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === 'user';
    const isBot = item.sender === 'bot';
    const isRecalled = item.isRecalled === true;

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        {isBot && (
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubbles" size={20} color="#fff" />
          </View>
        )}
        
        <TouchableOpacity
          onLongPress={() => handleLongPressMessage(item)}
          delayLongPress={500}
          activeOpacity={isUser && !isRecalled ? 0.7 : 1}
          disabled={!isUser || isRecalled}
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble,
            isRecalled && styles.recalledBubble,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isRecalled && (
              <Ionicons 
                name="arrow-undo" 
                size={14} 
                color={isUser ? '#FFD700' : '#999'} 
                style={{ marginRight: 5 }} 
              />
            )}
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userMessageText : styles.botMessageText,
                isRecalled && styles.recalledText,
              ]}
            >
              {item.text}
            </Text>
          </View>
          
          {/* Show AI badge for Gemini responses */}
          {isBot && item.source === 'gemini' && !isRecalled && (
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color="#FFD700" />
              <Text style={styles.aiBadgeText}>Powered by Gemini AI</Text>
            </View>
          )}
          
          {item.suggestions && item.suggestions.length > 0 && !isRecalled && (
            <View style={styles.suggestionsContainer}>
              {item.suggestions.map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionButton}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
            {item.timestamp?.toDate
              ? new Date(item.timestamp.toDate()).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : new Date(item.timestamp).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
          </Text>
        </TouchableOpacity>
        
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isBotTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.botMessageContainer]}>
        <View style={styles.botAvatar}>
          <Ionicons name="chatbubbles" size={20} color="#fff" />
        </View>
        <View style={[styles.messageBubble, styles.botBubble]}>
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerAvatar}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Hỗ trợ khách hàng</Text>
              <Text style={styles.headerSubtitle}>Luôn sẵn sàng hỗ trợ bạn</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {showUndoButton && undoInfo && (
              <TouchableOpacity 
                onPress={handleUndoDelete} 
                style={styles.undoButton}
              >
                <Ionicons name="arrow-undo" size={22} color="#FFD700" />
                <Text style={styles.undoTimerText}>
                  {undoInfo.hoursRemaining}h
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => setShowDeleteConfirm(true)} 
              style={styles.deleteButton}
              disabled={messages.length === 0}
            >
              <Ionicons 
                name="trash-outline" 
                size={22} 
                color={messages.length === 0 ? '#666' : '#fff'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages List - INVERTED: Newest at top! */}
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `${item.id || index}`}
            contentContainerStyle={styles.messagesList}
            inverted={true}
            onScroll={handleScroll}
            scrollEventThrottle={400}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={Platform.OS === 'android'}
            ListFooterComponent={renderTypingIndicator}
          />

          {/* Scroll to Bottom Button  */}
          {showScrollButton && (
            <TouchableOpacity 
              style={styles.scrollToBottomButton}
              onPress={scrollToBottom}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-down" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Confirmation Dialog */}
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.confirmModalOverlay}>
            <View style={styles.confirmModalContent}>
              <Ionicons name="trash-outline" size={50} color="#000D66" />
              <Text style={styles.confirmTitle}>Xóa lịch sử chat</Text>
              <Text style={styles.confirmMessage}>
                Chọn cách xóa tin nhắn:
              </Text>
              
              {/* Option buttons */}
              <View style={styles.deleteOptionsContainer}>
                <TouchableOpacity
                  style={[styles.deleteOptionButton, styles.temporaryDeleteButton]}
                  onPress={handleDeleteHistory}
                >
                  <View style={styles.deleteOptionContent}>
                    <View style={styles.deleteOptionHeader}>
                      <Ionicons name="time-outline" size={24} color="#2196F3" />
                      <Text style={styles.deleteOptionTitle}>Xóa tạm thời</Text>
                    </View>
                    <Text style={styles.deleteOptionDescription}>
                      Có thể hoàn tác trong 24 giờ
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#2196F3" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteOptionButton, styles.permanentDeleteButton]}
                  onPress={handlePermanentDelete}
                >
                  <View style={styles.deleteOptionContent}>
                    <View style={styles.deleteOptionHeader}>
                      <Ionicons name="trash-bin" size={24} color="#FF6B6B" />
                      <Text style={styles.deleteOptionTitle}>Xóa vĩnh viễn</Text>
                    </View>
                    <Text style={styles.deleteOptionDescription}>
                      Không thể khôi phục lại
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>

              {/* Cancel button */}
              <TouchableOpacity
                style={styles.cancelFullButton}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelFullButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Message Menu Modal */}
        <Modal
          visible={showMessageMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMessageMenu(false)}
        >
          <TouchableOpacity 
            style={styles.messageMenuOverlay}
            activeOpacity={1}
            onPress={() => setShowMessageMenu(false)}
          >
            <View style={styles.messageMenuContent}>
              <TouchableOpacity
                style={styles.messageMenuItem}
                onPress={handleRecallMessage}
              >
                <Ionicons name="arrow-undo" size={22} color="#FF6B6B" />
                <Text style={styles.messageMenuText}>Thu hồi tin nhắn</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background (same as HomeScreen)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 30,
    paddingBottom: 15,
    backgroundColor: '#000D66', // Navy Blue (main app color)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#001A99', // Slightly lighter navy
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#f0f0f0',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    gap: 4,
  },
  undoTimerText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0033CC', // Medium Navy Blue
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000D66', // Navy Blue (main color)
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#000D66', // User: Navy Blue
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF', // Bot: White
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light gray border
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: '#FFFFFF', // Trắng cho user
    opacity: 0.9,
  },
  botTimestamp: {
    color: '#333333', // Đen cho bot
    opacity: 0.8,
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionButton: {
    backgroundColor: '#E0F2FF', // Light blue background - dễ thấy
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginTop: 5,
    borderWidth: 1.5,
    borderColor: '#2196F3', // Bright blue border - nổi bật
  },
  suggestionText: {
    color: '#1976D2', // Bright navy text - dễ đọc
    fontSize: 13,
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3', // Bright Blue - nổi bật
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    color: '#FFFFFF', // White text - rõ ràng
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000D66', // Navy dots
    marginHorizontal: 2,
  },
  typingDot1: {
    animation: 'typing 1.4s infinite',
  },
  typingDot2: {
    animation: 'typing 1.4s infinite 0.2s',
  },
  typingDot3: {
    animation: 'typing 1.4s infinite 0.4s',
  },
  inputContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#E5E7EB', // Light gray border
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F3F4F6', // Light gray input background
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000D66', // Navy Blue (main color)
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
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000D66', // Navy Blue (main color)
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 1000,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  deleteOptionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  deleteOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  temporaryDeleteButton: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  permanentDeleteButton: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFE8E8',
  },
  deleteOptionContent: {
    flex: 1,
  },
  deleteOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  deleteOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteOptionDescription: {
    fontSize: 13,
    color: '#666',
    marginLeft: 34,
  },
  cancelFullButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelFullButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  recalledBubble: {
    opacity: 0.7,
    borderStyle: 'dashed',
  },
  recalledText: {
    fontStyle: 'italic',
    opacity: 0.8,
  },
  messageMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageMenuContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  messageMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  messageMenuText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});

export default ChatBox;
