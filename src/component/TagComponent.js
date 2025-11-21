import { StyleSheet, Text, View,TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import Swiper from 'react-native-swiper'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { getBestSellingProducts } from '../Firebase/FirebaseAPI'

const { width } = Dimensions.get('window');

const TagComponent = () => {
  const navigation = useNavigation();
  const [bestSellingData, setBestSellingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBestSellingProducts();
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
    }
  };

  const handleSeeAll = () => {
    navigation.navigate('BestSellingProducts', { products: bestSellingData });
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Sản phẩm bán chạy</Text>
        </View>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={handleSeeAll}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>Tất cả</Text>
          <Ionicons name="chevron-forward" size={16} color="#FF5722" />
        </TouchableOpacity>
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
              <View style={styles.card}>
                <View style={styles.imageWrapper}>
                  <Image 
                    source={item.image ? { uri: item.image } : require('../../assets/images/Tag/tablec.jpg')} 
                    style={styles.image}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.gradient}
                  >
                    <View style={styles.textContainer}>
                      <View style={styles.productInfoContainer}>
                        <Text style={styles.productName}>{item.name}</Text>
                        {item.totalSold > 0 && (
                          <Text style={styles.soldCount}>Đã bán: {item.totalSold}</Text>
                        )}
                      </View>
                      <View style={styles.badge}>
                        <Ionicons name="trending-up" size={12} color="#fff" />
                        <Text style={styles.badgeText}>Bán chạy</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            </View>
          ))}
        </Swiper>
      </View>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seeAllText: {
    color: '#FF5722',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 2,
  },
  swiperContainer: {
    height: 220,
    paddingHorizontal: 8,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
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
    height: '50%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  productInfoContainer: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  soldCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    opacity: 0.9,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  pagination: {
    bottom: 8,
  },
  dot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
    marginRight: 4,
  },
  activeDot: {
    backgroundColor: '#FF5722',
    width: 20,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
    marginRight: 4,
  },
})