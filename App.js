import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RootNavigation from './src/navigator/RootNavigation';
import BestSellingProducts from './src/screen/BestSellingProducts';
import { UserProvider } from './src/Firebase/UserContext';

const Stack = createStackNavigator();

const App = () => {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="Root" 
            component={RootNavigation}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="BestSellingProducts" 
            component={BestSellingProducts}
            options={{
              title: 'Sản phẩm bán chạy',
              headerStyle: {
                backgroundColor: '#077f7b',
              },
              headerTintColor: '#fff',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};

export default App;
