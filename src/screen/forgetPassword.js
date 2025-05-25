import React, { useState } from 'react';
import { 
  StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resetPasswordEmail } from '../Firebase/FirebaseAPI';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError("Vui lòng nhập email của bạn.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email không hợp lệ.");
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await resetPasswordEmail(email); 
      setLoading(false);

      if (result.success) {
        Alert.alert("Thành công", "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.");
        setEmail('');
      } else {
        Alert.alert("Thất bại", result.error || "Không thể gửi email đặt lại mật khẩu.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi email đặt lại mật khẩu.");
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#F0F4FF'}}>
      <View style={{alignItems: 'center', marginTop: 30, marginBottom: 10}}>
        <Image source={require('../../assets/images/furniturelogo.png')} style={{width: 60, height: 60, borderRadius: 15, marginBottom: 8}} />
        <Text style={{fontSize: 30, fontWeight: 'bold', color: '#000D66', letterSpacing: 1}}>NỘI THẤT DECCOR</Text>
      </View>
      <View style={{flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, elevation: 8}}>
        <Text style={{fontSize: 28, fontWeight: 'bold', color: '#000D66', marginBottom: 24, textAlign: 'center'}}>Quên mật khẩu</Text>
        <Text style={{fontSize: 16, color: '#001F99', marginBottom: 24, textAlign: 'center'}}>Nhập email đăng ký để nhận mật khẩu mới</Text>
        <TextInput
          style={[styles.input, error ? styles.inputError : null, {marginBottom: 18}]}
          placeholder="Nhập Email"
          placeholderTextColor="#4D79FF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled, {marginTop: 8}]} 
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "Đang gửi..." : "Đặt lại mật khẩu"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ForgetPassword;

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
    fontSize: 18,
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000D66',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#001F99',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#4D79FF',
    fontSize: 16,
    color: '#001F99',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  btn: {
    width: '100%',
    height: 50,
    backgroundColor: '#000D66',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: '#4D79FF',
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});