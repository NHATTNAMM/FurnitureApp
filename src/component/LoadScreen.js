// Loading.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Modal } from 'react-native';

const LoadScreen = ({ isLoading, text = 'Đang tải...' }) => {
  return (
    <Modal
      visible={isLoading}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalBackground}>
        <View style={styles.dialogContainer}>
          <ActivityIndicator size="large" color="#000d66" />
          <Text style={styles.loadingText}>{text}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    minWidth: 180,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000d66',
  },
});

export default LoadScreen;
