import React, { useState, useEffect, useContext, useCallback } from 'react';
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
  StatusBar,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllUserChats,
  loadChatMessages,
  sendAdminMessage,
} from '../Firebase/ChatAPI';
import { UserContext } from '../Firebase/UserContext';
import { LogOut } from '../Firebase/FirebaseAPI';

const AdminChatScreen = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const flatListRef = React.useRef(null);

  // Menu items tương tự như AdminScreen
  const menuItem = [
    { key: '1', label: 'Thống kê tổng quan' },
    { key: '8', label: 'Thống kê sản phẩm' },
    { key: '2', label: 'Khách hàng' },
    { key: '3', label: 'Sản phẩm' },
    { key: '4', label: 'Đơn hàng' },
    { key: '5', label: 'Cập nhật thông tin cửa hàng' },
    { key: '7', label: 'Quản lý Chat' },
    { key: '6', label: 'Đăng xuất' },
  ];

  useEffect(() => {
    // Kiểm tra quyền admin
    if (!user) {
      return;
    }
    
    if (user.role !== 'admin') {
      Alert.alert(
        "Không có quyền truy cập",
        "Bạn không có quyền truy cập trang này",
        [
          {
            text: "OK",
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'LogIn' }],
            })
          }
        ]
      );
      return;
    }

    loadChats();
    
    // Reload chats every 30 seconds
    const interval = setInterval(loadChats, 30000);
    return () => clearInterval(interval);
  }, [user?.id, user?.role]); // Bỏ loadChats ra khỏi dependencies vì nó đã stable với useCallback

  const handleLogOut = () => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        onPress: async () => {
          const result = await LogOut();
          if (result.success) {
            navigation.reset({
              index: 0,
              routes: [{ name: "LogIn" }],
            });
          } else {
            Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại!");
          }
        }
      }
    ]);
  };

  const handleMenuPress = (key) => {
    setSidebar(false);
    
    switch (key) {
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '8':
        navigation.navigate('AdminHome', { selectedMenu: key });
        break;
      case '6':
        handleLogOut();
        break;
      case '7':
        // Đã ở trang chat rồi, không cần làm gì
        break;
      default:
        break;
    }
  };

  const getIconName = (key) => {
    switch (key) {
      case '1': return 'stats-chart';
      case '2': return 'people';
      case '3': return 'cube';
      case '4': return 'receipt';
      case '5': return 'business';
      case '7': return 'chatbubbles';
      case '8': return 'analytics';
      case '6': return 'log-out';
      default: return 'square';
    }
  };

  const loadChats = useCallback(async () => {
    setIsLoading(true);
    const result = await getAllUserChats();
    if (result.success) {
      setChats(result.data);
    }
    setIsLoading(false);
  }, []); // Empty dependency - function không thay đổi

  const handleChatPress = (chat) => {
    setSelectedChat(chat);
    setModalVisible(true);
  };

  // useEffect để load messages khi modal được mở
  useEffect(() => {
    if (!selectedChat || !modalVisible) {
      return;
    }

    let isMounted = true; // Flag để tránh update khi component unmount

    // Load messages - Reverse để tin mới nhất ở trên cùng
    const unsubscribe = loadChatMessages(selectedChat.userId, (loadedMessages) => {
      if (isMounted) {
        setMessages([...loadedMessages].reverse());
      }
    });

    // Cleanup khi đóng modal hoặc chọn chat khác
    return () => {
      isMounted = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [selectedChat?.userId, modalVisible]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setShowScrollButton(false);
  };

  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    // Show button when scrolled up more than 100px
    setShowScrollButton(contentOffset.y > 100);
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
        <Text style={styles.chatUserName}>{item.userName}</Text>
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

  // Nếu không phải admin thì không render
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#000d66" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header tương tự AdminScreen */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.openBtn} 
            onPress={() => setSidebar(true)}
          >
            <Ionicons name="menu" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Quản lý Chat</Text>
            <Text style={styles.headerSubtitle}>Quản lý hệ thống</Text>
          </View>
          <TouchableOpacity onPress={loadChats} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.container}>
          {/* Sidebar overlay */}
          {sidebar && 
            <TouchableWithoutFeedback onPress={() => setSidebar(false)}>
              <View style={styles.overPlay}></View>
            </TouchableWithoutFeedback>
          }
          
          {/* Sidebar */}
          {sidebar && (
            <View style={styles.sidebar}>
              <View style={styles.sidebarHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.adminAvatarContainer}>
                    <Text style={styles.avatarText}>
                      {user?.fullName?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user?.fullName}</Text>
                    <Text style={styles.userRole}>Quản trị viên</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setSidebar(false)} 
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.menuContainer}>
                {menuItem.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.menuItem,
                      item.key === '7' && styles.menuItemActive // Highlight chat menu
                    ]}
                    onPress={() => handleMenuPress(item.key)}
                  >
                    <Ionicons 
                      name={getIconName(item.key)} 
                      size={22} 
                      color="white" 
                    />
                    <Text style={styles.menuText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.contentContainer}>
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
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Chat Modal */}
      <Modal
        visible={modalVisible}
        animationType="none"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedChat(null);
          setMessages([]);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setModalVisible(false);
              setSelectedChat(null);
              setMessages([]);
            }}>
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
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => `${item.id || index}`}
              contentContainerStyle={styles.messagesList}
              inverted={true}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />

            {/* Scroll to Bottom Button */}
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
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000d66',
  },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#000d66',
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  openBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: '75%',
    backgroundColor: '#000d66',
    position: 'absolute',
    zIndex: 10,
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuContainer: {
    padding: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#ffffff',
  },
  menuText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  overPlay: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000D66',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
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
  chatUserName: {
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
    backgroundColor: '#000D66',
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
    color: '#E0E7FF',
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
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#000D66',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000D66',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000D66',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 1000,
  },
});

export default AdminChatScreen;
