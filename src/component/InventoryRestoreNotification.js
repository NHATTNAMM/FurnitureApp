import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InventoryRestoreNotification = ({ visible, message, onClose }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.notification}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#28a745" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Hoàn trả tồn kho</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  notification: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
});

export default InventoryRestoreNotification;
