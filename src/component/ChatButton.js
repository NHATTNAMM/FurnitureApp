import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChatBox from './ChatBox';
import { UserContext } from '../Firebase/UserContext';
import { getUnreadMessageCount } from '../Firebase/ChatAPI';

const ChatButton = () => {
  const { user } = useContext(UserContext);
  const [chatVisible, setChatVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (user?.id) {
      // Check unread messages every 10 seconds
      const checkUnread = async () => {
        const count = await getUnreadMessageCount(user.id);
        setUnreadCount(count);
        
        // Animate badge if there are new messages
        if (count > 0) {
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.3,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      };

      checkUnread();
      const interval = setInterval(checkUnread, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, scaleAnim]); // ✅ Thêm scaleAnim vào dependencies

  // ❌ Ẩn chatbot nếu:
  // 1. Chưa đăng nhập (user = null)
  // 2. User là Admin (role = 'admin')
  // 3. User là Shipper (role = 'shipper')
  if (!user || user.role === 'admin' || user.role === 'shipper') {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => setChatVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubbles" size={28} color="#fff" />
          {unreadCount > 0 && (
            <Animated.View
              style={[
                styles.badge,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>

      <ChatBox
        visible={chatVisible}
        onClose={() => {
          setChatVisible(false);
          setUnreadCount(0);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  chatButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000D66',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 999,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});

export default ChatButton;
