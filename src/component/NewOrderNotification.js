import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity, Vibration } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const NewOrderNotification = ({ visible, orderCount, onPress, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Rung điện thoại để thông báo
      Vibration.vibrate([0, 500, 200, 500]);
      
      // Hiển thị thông báo với animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Tự động ẩn sau 5 giây
      const timer = setTimeout(() => {
        hideNotification();
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    } else {
      hideNotification();
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="shopping-bag" size={30} color="#FFF" />
          {orderCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{orderCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Đơn hàng mới!</Text>
          <Text style={styles.message}>
            {orderCount === 1 
              ? 'Có 1 đơn hàng mới chờ giao' 
              : `Có ${orderCount} đơn hàng mới chờ giao`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <MaterialIcons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 15,
    paddingTop: 50,
  },
  notificationCard: {
    backgroundColor: '#000D66',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  closeButton: {
    padding: 8,
  },
});

export default NewOrderNotification;
