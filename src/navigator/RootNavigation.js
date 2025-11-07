import React from 'react'
import { View, StyleSheet } from 'react-native';
import ScreensNavigation from './ScreensNavigation';
import {UserProvider} from '../Firebase/UserContext';
import ChatButton from '../component/ChatButton';

const RootNavigation = () => {
  return (
    <UserProvider>
      <View style={styles.container}>
        <ScreensNavigation/>
        <ChatButton />
      </View>
    </UserProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RootNavigation