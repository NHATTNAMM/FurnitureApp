import { StyleSheet, Text, View,TouchableOpacity, Image, Dimensions, ActivityIndicator, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import Swiper from 'react-native-swiper'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { getBestSellingProducts } from '../Firebase/FirebaseAPI'

const { width } = Dimensions.get('window');

const TagComponent = () => {
  const navigation = useNavigation();
  const [bestSellingData, setBestSellingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadBestSellingProducts();
    
    // Shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const loadBestSellingProducts = async () => {
    try {
      const result = await getBestSellingProducts();
      
      if (result.success && result.data.length > 0) {
        setBestSellingData(result.data);
      } else {
        // Dữ liệu mặc định nếu chưa có đơn hàng
        setBestSellingData([
          { id:'1', name: 'Bộ bàn ghế hiện đại', image: 'https://res.cloudinary.com/dleidkd6p/image/upload/v1730824899/tablec_yjuv4o.jpg', totalSold: 0 },
          { id:'2', name: 'Bàn học', image: 'https://res.cloudinary.com/dleidkd6p/image/upload/v1730824900/table_k9d1fy.jpg', totalSold: 0 },
          { id:'3', name: 'Tủ sách', image: 'https://res.cloudinary.com/dleidkd6p/image/upload/v1730824899/bookcase_nqx8n0.jpg', totalSold: 0 },
          { id:'4', name: 'Giường đa năng', image: 'https://res.cloudinary.com/dleidkd6p/image/upload/v1730824898/bed_mvevl6.jpg', totalSold: 0 },
        ]);
      }
    } catch (error) {
      console.error('Lỗi load sản phẩm bán chạy:', error);
      // Fallback data
      setBestSellingData([
        { id:'1', name: 'Bộ bàn ghế hiện đại', image: 'https://res.cloudinary.com/dleidkd6p/image/upload/v1730824899/tablec_yjuv4o.jpg', totalSold: 0 },
        { id:'2', name: 'Bàn học', image: 'https://res.cloudinary.com/dleidkd6p/image/upload/v1730824900/table_k9d1fy.jpg', totalSold: 0 },
      ]);
    } finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Đang tải sản phẩm bán chạy...</Text>
      </View>
    );
  }

  if (bestSellingData.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.header}>
        <Animated.View style={[styles.titleWrapper, { 
          transform: [{ scale: pulseAnim }] 
        }]}>
          <Text style={styles.title}>Sản phẩm bán chạy</Text>
          <Animated.View style={[styles.shimmerLine, {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 1, 0.3]
            })
          }]} />
        </Animated.View>
      </View>
      
      <View style={styles.swiperContainer}>
        <Swiper  
          autoplay={true}
          autoplayTimeout={4}
          showsPagination={true}
          dotStyle={styles.dot}
          activeDotStyle={styles.activeDot}
          paginationStyle={styles.pagination}
          loop={true}
          height={220}
        >
          {bestSellingData.map((item, index) => (
            <View key={item.id || index} style={styles.slide}>
              <Animated.View style={styles.card}>
                <Image 
                  source={item.image ? { uri: item.image } : require('../../assets/images/Tag/tablec.jpg')} 
                  style={styles.image}
                />
                
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                  locations={[0, 0.5, 1]}
                  style={styles.gradient}
                />

                <View style={styles.content}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  
                  {item.totalSold > 0 && (
                    <Animated.View style={[styles.badge, {
                      transform: [{ scale: pulseAnim }]
                    }]}>
                      <LinearGradient
                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
                        style={styles.badgeGradient}
                      >
                        <Ionicons name="flame" size={16} color="#FF6B35" />
                        <Text style={styles.badgeText}>{item.totalSold}</Text>
                      </LinearGradient>
                    </Animated.View>
                  )}
                </View>
              </Animated.View>
            </View>
          ))}
        </Swiper>
      </View>
    </Animated.View>
  )
}

export default TagComponent

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleWrapper: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000D66',
    letterSpacing: -0.8,
  },
  shimmerLine: {
    height: 3,
    backgroundColor: '#FF6B35',
    marginTop: 6,
    borderRadius: 2,
  },
  swiperContainer: {
    height: 220,
    marginHorizontal: -20,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    letterSpacing: -0.8,
    lineHeight: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  badge: {
    marginLeft: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  pagination: {
    bottom: 12,
  },
  dot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 32,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
})