import React, { useState, useEffect } from 'react';
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
import { auth } from '../Firebase/FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);

  const navigation = useNavigation();

  // Đảm bảo Firebase Auth đã khởi tạo xong
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isAuthReady) {
        setIsAuthReady(true);
      }
      // Nếu đã đăng nhập và có role thì navigate luôn
      if (user && !loading) {
        // Không tự động navigate ở đây để tránh conflict
      }
    });

    return () => unsubscribe();
  }, [isAuthReady, loading]);

  const handleLogIn = async () => {
    if (!isAuthReady) {
      setErrorMessage("Đang khởi tạo hệ thống, vui lòng đợi...");
      return;
    }

    if (!email || !password) {
      setErrorMessage("Vui lòng nhập tài khoản và mật khẩu");
      return;
    }
    
    // Xóa thông báo lỗi cũ
    setErrorMessage('');
    setLoading(true);

    try {
      console.log('Starting login process...'); // Debug log
      
      const result = await LogIn({ email, password });
      
      console.log('Login result:', result); // Debug log
      
      if (result.success) {
        const userRole = result.user.role;
        console.log('Login successful, user role:', userRole); // Debug log
        
        // Đợi một chút để UserContext xử lý auth state
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Điều hướng dựa trên role
        setLoading(false); // Set loading false trước khi navigate
        
        if (userRole === "shipper") {
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeShipper' }],
          });
        } else if (userRole === "admin") {
          navigation.reset({
            index: 0,
            routes: [{ name: 'AdminHome' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }
      } else {
        setLoading(false);
        setErrorMessage(result.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      setErrorMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
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
              onChangeText={(text) => {
                setEmail(text);
                setErrorMessage(''); // Xóa thông báo lỗi khi người dùng nhập
              }}
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
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage(''); // Xóa thông báo lỗi khi người dùng nhập
              }}
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
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          <TouchableOpacity onPress={() => navigation.navigate('ForgetPassword')} style={{alignSelf: 'flex-end', marginBottom: 18}}>
            <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleLogIn} 
            style={[styles.loginButton, {width: '90%'}, loading && {opacity: 0.7}]}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Text>
          </TouchableOpacity>
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
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    width: '90%',
  },
});

export default LoginScreen;
