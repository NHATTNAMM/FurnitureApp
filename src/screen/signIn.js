import React, { useState } from 'react'
import{
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import style from '../globals/style'
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Fontisto from '@expo/vector-icons/Fontisto';
import globalStyles from '../globals/globalStyles';
import BottomNavigation from '../navigator/BottomNavigation';
import { signInUser } from '../Firebase/FirebaseAPI';
import LoadScreen from '../component/LoadScreen';

const SignInScreen = () => {
  const [fullName,setFullName] = useState('')
  const [phone , setPhone] =useState('');
  const [email, setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,setShowPassword] = useState(false);
  const [showConfirmPassword,setShowConfirmPassword] = useState(false);
  const [loading,setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSignUp = async () =>{
    if(password !== confirmPassword){
      Alert.alert("Mật khẩu không khớp", "Vui lòng kiểm tra lại mật khẩu và xác nhận mật khẩu");
      return;
    }
    try{
      setLoading(true);
      const result = await signInUser({
        email,
        password,
        fullName,
        phone,
        address:'',
        role: 'user' // Mặc định là user
      })
      if(result.success)
      {
        Alert.alert("Đăng ký thành công", "Chúc mừng bạn đã đăng ký thành công!");
        navigation.navigate('LogIn');
      }
      else {
        Alert.alert("Lỗi", result.error);
      }
      setLoading(false);
    }
    catch(error){
      Alert.alert("Đăng ký thất bại", error.message);
    }
  }

  const handleShipperSignUp = async () => {
    if(password !== confirmPassword){
      Alert.alert("Mật khẩu không khớp", "Vui lòng kiểm tra lại mật khẩu và xác nhận mật khẩu");
      return;
    }
    try{
      setLoading(true);
      const result = await signInUser({
        email,
        password,
        fullName,
        phone,
        address:'',
        role: 'shipper' // Đăng ký với role shipper
      })
      if(result.success)
      {
        Alert.alert("Đăng ký Shipper thành công", "Chúc mừng bạn đã đăng ký tài khoản Shipper!");
        navigation.navigate('LogIn');
      }
      else {
        Alert.alert("Lỗi", result.error);
      }
      setLoading(false);
    }
    catch(error){
      Alert.alert("Đăng ký thất bại", error.message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <Image source={require('../../assets/images/furniturelogo.png')} style={styles.logo} />
          <Text style={styles.title}>Đăng ký tài khoản</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={24} color="#000D66" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={24} color="#000D66" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color="#000D66" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={24} color="#000D66" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={24}
                color="#000D66"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={24} color="#000D66" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={24}
                color="#000D66"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleSignUp}>
            <Text style={styles.loginText}>Đăng ký tài khoản</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleShipperSignUp}>
            <Text style={styles.loginText}>Đăng ký tài khoản Shipper</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
            <Text style={styles.forgotPassword}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
      <LoadScreen isLoading={loading} text="Đang xử lý..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4FF',
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
});

export default SignInScreen;