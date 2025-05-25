import React from 'react';
import { View, ActivityIndicator, StyleSheet,Text } from 'react-native';

const Loading = ({ isLoading,text='Đang tải...' }) => {
  if (!isLoading) return null;

  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size="large" color="#000d66" />
      <Text style={styles.loadingText}>{text} </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000d66',
    fontWeight: '500',
  },
});

export default Loading;
