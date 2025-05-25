import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PRIMARY = '#000d66';
const ACCENT = '#ffb300';
const BG = '#f3f4f6';

const WelcomeScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>NỘI THẤT DECOR</Text>
        <Text style={styles.slogan}>Không gian sống hiện đại & đẳng cấp</Text>
      </View>
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          source={require('../../assets/images/welcome.png')}
        />
      </View>
      <Text style={styles.welcomeText}>Chào mừng bạn đến với thế giới nội thất hiện đại</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('LogIn')}>
        <Text style={styles.btnText}>Bắt đầu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brand: {
    fontSize: 36,
    color: PRIMARY,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  slogan: {
    fontSize: 16,
    color: ACCENT,
    fontWeight: '600',
    marginBottom: 12,
  },
  imageContainer: {
    width: 260,
    height: 320,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 8,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  welcomeText: {
    fontSize: 22,
    color: PRIMARY,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 36,
    marginTop: 8,
    lineHeight: 32,
  },
  btn: {
    backgroundColor: PRIMARY,
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  btnText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default WelcomeScreen;
