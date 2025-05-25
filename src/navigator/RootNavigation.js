import React from 'react'
import ScreensNavigation from './ScreensNavigation';
import {UserProvider} from '../Firebase/UserContext';

const RootNavigation = () => {
  return (
    <UserProvider>
      <ScreensNavigation/>
    </UserProvider>
  )
}

export default RootNavigation