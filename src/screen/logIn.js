import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Image, TouchableOpacity, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { LogIn } from '../Firebase/FirebaseAPI';
import LoadScreen from '../component/LoadScreen';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const handleLogIn = async () => {
    if (!email || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập tài khoản và mật khẩu");
      return;
    }
    setLoading(true);

    const result = await LogIn({ email, password });
    setLoading(false);

    if (result.success) {
      const userRole = result.user.role;
      if (userRole === "shipper") {
        navigation.navigate('HomeShipper');
      } else if (userRole === "admin") {
        navigation.navigate('AdminHome');
      } else {
        navigation.navigate('Home');
      }
    } else {
      Alert.alert("Đăng nhập thất bại", result.error);
    }
  };

  const handleAdminLogin = async () => {
    if (!email || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập tài khoản và mật khẩu");
      return;
    }
    setLoading(true);
    try {
    const result = await LogIn({ email, password });
    if (result.success) {
      const userRole = result.user.role;
      if (userRole === "admin") {
          navigation.navigate('AdminHome');
      } else {
          Alert.alert("Thông báo", "Tài khoản này không có quyền admin!");
      }
    } else {
      Alert.alert("Đăng nhập thất bại", result.error);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#F0F4FF'}}>
      <View style={{alignItems: 'center', marginTop: 30, marginBottom: 10}}>
        <Image source={require('../../assets/images/furniturelogo.png')} style={{width: 100, height: 100, borderRadius: 15, marginBottom: 8}} />
        <Text style={{fontSize: 30, fontWeight: 'bold', color: '#000D66', letterSpacing: 1}}>NỘI THẤT DECOR</Text>
      </View>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <View style={{width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, elevation: 8, alignItems: 'center'}}>
          <Text style={{fontSize: 28, fontWeight: 'bold', color: '#000D66', marginBottom: 24, textAlign: 'center'}}>Đăng Nhập</Text>
          <View style={[styles.inputContainer, {marginBottom: 18, width: '90%'}]}> 
            <AntDesign style={styles.icon} name="user" size={22} color="#000D66" />
            <TextInput 
              style={styles.input}
              placeholder="Nhập Email"
              placeholderTextColor="#4D79FF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={[styles.inputContainer, {marginBottom: 18, width: '90%'}]}> 
            <MaterialIcons style={styles.icon} name="lock-outline" size={22} color="#000D66" />
            <TextInput
              style={styles.input}
              placeholder="Nhập Mật khẩu"
              placeholderTextColor="#4D79FF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <Feather
              style={[styles.icon, { marginLeft: -10 }]}
              name={showPassword ? 'eye' : 'eye-off'}
              size={22}
              color="#9E9E9E"
              onPress={() => setShowPassword(!showPassword)}
            />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ForgetPassword')} style={{alignSelf: 'flex-end', marginBottom: 18}}>
            <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogIn} style={[styles.loginButton, {width: '90%'}]}>
            <Text style={styles.loginText}>Đăng nhập</Text>
          </TouchableOpacity>
          <View style={{flexDirection: 'row', width: '90%', justifyContent: 'flex-end', marginBottom: 10}}>
            <TouchableOpacity onPress={handleAdminLogin} style={{padding: 6}}>
              <Text style={{color: '#000D66', fontWeight: 'bold'}}>Đăng nhập Admin</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.otherLoginText}>Hoặc đăng nhập bằng</Text>
          <View style={styles.iconLoginLayout}>
            <TouchableOpacity style={styles.iconLogin}>
              <AntDesign name="google" size={24} color="red" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconLogin}>
              <AntDesign name="facebook-square" size={24} color="blue" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={{alignSelf: 'center', marginTop: 10}}>
            <Text style={styles.registerText}>
              Chưa có tài khoản? <Text style={styles.boldText}>Đăng ký ngay</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <LoadScreen isLoading={loading} text="Đang đăng nhập..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  nav: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000D66',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  innerContainer: {
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000D66',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 10,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 50,
    width: '90%',
    borderWidth: 1,
    borderColor: '#4D79FF',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#001F99',
    marginLeft: 10,
  },
  icon: {
    marginVertical: 12,
    color: '#000D66',
  },
  forgotPassword: {
    color: '#001F99',
    fontSize: 14,
    marginBottom: 20,
  },
  loginButton: {
    width: '90%',
    height: 50,
    backgroundColor: '#000D66',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    marginBottom: 20,
    elevation: 5,
  },
  loginText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  otherLoginText: {
    color: '#001F99',
    fontSize: 14,
    marginBottom: 10,
  },
  iconLoginLayout: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconLogin: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 50,
    marginHorizontal: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#4D79FF',
  },
  registerText: {
    fontSize: 14,
    color: '#001F99',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000D66',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
