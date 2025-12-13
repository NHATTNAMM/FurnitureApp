import React, { useEffect, useState, useContext } from 'react'
import { 
  Text, 
  View, 
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  FlatList,
  Alert,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import globalStyles from '../globals/globalStyles';
import { useNavigation } from '@react-navigation/native';
import BottomNavigation from '../navigator/BottomNavigation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialIcons, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Style from '../globals/style';
import TagComponent from '../component/TagComponent';
import { addToCart, loadFurnitureHome, removeFavoritesFurniture, loadCartRealTime } from '../Firebase/FirebaseAPI';
import Loading from '../component/Loading';
import FurnitureItem from './FurnitureItem';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { UserContext } from '../Firebase/UserContext';
import AddFavorites from './Favorites/AddFavorites';
import OutOfStockBadge from '../component/OutOfStockBadge';
import PriceDisplay from '../component/PriceDisplay';
import DiscountBadge from '../component/DiscountBadge';
import GlassDiscountBadge from '../component/GlassDiscountBadge';
import ChatButton from '../component/ChatButton';

const { width } = Dimensions.get('window');

const categories = [
  { id: 1, name: 'Tất cả', icon: 'sofa', tag: 'Tất cả' },
  { id: 2, name: 'Phòng khách', icon: 'sofa-single', tag: 'Phòng khách' },
  { id: 3, name: 'Phòng ngủ', icon: 'bed', tag: 'Phòng ngủ' },
  { id: 4, name: 'Phòng bếp', icon: 'stove', tag: 'Phòng bếp' },
  { id: 5, name: 'Phòng tắm', icon: 'shower', tag: 'Phòng tắm' },
  { id: 6, name: 'Trang trí', icon: 'flower', tag: 'Trang trí' },
  { id: 7, name: 'Đèn', icon: 'lamp', tag: 'Đèn' },
  { id: 8, name: 'Ngoại thất', icon: 'home', tag: 'Ngoại thất' },
  { id: 9, name: 'Phụ kiện', icon: 'cushion', tag: 'Phụ kiện' },
];

const HomeScreen = () => {
    const navigation = useNavigation();
    const { user } = useContext(UserContext);
    const [menu,showMenu] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [furnitureData,setFurnitureData] = useState([]);
    const [selectedTag, setSelectedTag] = useState(null);
    const [filteredFurniture, setFilteredFurniture] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [selectedFurniture, setSelectedFurniture] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [favoriteItems, setFavoriteItems] = useState([]);
    const scrollY = new Animated.Value(0);
    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [priceFilterModalVisible, setPriceFilterModalVisible] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [tempMinPrice, setTempMinPrice] = useState('');
    const [tempMaxPrice, setTempMaxPrice] = useState('');

    const openModal = (furnitureItem) => {
      if (furnitureItem !== selectedFurniture){
         setSelectedFurniture(furnitureItem);
         setModalVisible(true);
      }
   };

    const closeModal = (furnitureItem) =>{
      setSelectedFurniture(null);
      setModalVisible(false)
    }

    const handleAddToFavorites = async (furnitureId) => {
      if (!userId) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để thêm vào danh sách yêu thích.");
        return;
      }
      if(favoriteItems.includes(furnitureId)){
        const result  =  await removeFavoritesFurniture(userId,furnitureId);
        if (result.success) {
          Alert.alert("Đã xóa sản phẩm khỏi danh sách yêu thích", result.message);
          setFavoriteItems(favoriteItems.filter(item => item !== furnitureId));
        } else {
          Alert.alert("Lỗi", result.message);
        }
      }
      else{
        const result = await addToFavoritesFurniture(userId, furnitureId);
        if (result.success) {
          Alert.alert("Đã thêm sản phẩm vào danh sách yêu thích", result.message);
          setFavoriteItems([...favoriteItems, furnitureId]);
        } else {
          Alert.alert("Lỗi", result.message);
        }
      }
    }

    const handleAddToCart = async (userId, furnitureItem,soLuong,tongGia) => {
      const result = await addToCart(userId, furnitureItem,soLuong,tongGia);
      if (result.success) {
        Alert.alert("Đã thêm sản phẩm vào giỏ hàng", result.message);
        closeModal();
      } else {
        Alert.alert("Lỗi", result.message);
      }
    };

    const handleLoadCart = async (userId) => {
      const result = await loadCart(userId, setCartItems); 
      if (result.success) {
        console.log("Giỏ hàng đã được tải thành công:", result.cart);
        navigation.navigate('Cart');
      } else {
        console.log("Lỗi khi tải giỏ hàng:", result.message);
      }
    };

    useEffect(()=>{
      const stopLoadFurniture = loadFurnitureHome((data)=>{
        setFurnitureData(data)
        setFilteredFurniture(data)
        setLoading(false);
      });
      return () => stopLoadFurniture();
    }, []);

    useEffect(() => {
      let filtered = furnitureData;
      
      // Lọc theo tag
      if (selectedTag === 'Tất cả'){
        filtered = furnitureData;
      } else if(selectedTag !== null) {
        filtered = furnitureData.filter(item => Array.isArray(item.tag) && item.tag.includes(selectedTag));
      }
      
      // Lọc theo giá
      if (minPrice !== '' || maxPrice !== '') {
        filtered = filtered.filter(item => {
          const itemPrice = item.discountPercentage > 0 
            ? item.furniturePrice * (1 - item.discountPercentage / 100)
            : item.furniturePrice;
          
          const min = minPrice === '' ? 0 : parseFloat(minPrice);
          const max = maxPrice === '' ? Infinity : parseFloat(maxPrice);
          
          return itemPrice >= min && itemPrice <= max;
        });
      }
      
      setFilteredFurniture(filtered);
    }, [selectedTag, furnitureData, minPrice, maxPrice]); 
    
    const handleTag = (tag) => {
      if (selectedTag === tag) {
        setSelectedTag(null);
      } else {
        setSelectedTag(tag);
      }
    };

    useEffect(() =>{
      const auth = getAuth();
      const un = onAuthStateChanged(auth,(user) =>{
        if(user){
          console.log("Đã đăng nhập, userID:", user.uid);
          if (user.uid !== userId) {
            setUserId(user.uid);
         }
        }
        else{
          console.log("Chưa đăng nhập");
        navigation.navigate('LogIn');
        }
      })
      return () => un();
    },[navigation])

    // Load giỏ hàng real-time
    useEffect(() => {
      if (userId) {
        const unsubscribe = loadCartRealTime(userId, setCartItems);
        return () => {
          if (unsubscribe) unsubscribe();
        };
      }
    }, [userId]);

    const headerHeight = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [200, 100],
      extrapolate: 'clamp',
    });

    const handleLocationPress = () => {
        navigation.navigate('ProfileDetail');
    };

    const getShortAddress = (address) => {
      if (!address) return 'Chưa cập nhật địa chỉ';
      // Lấy 30 ký tự cuối, thêm ... nếu dài
      const maxLen = 30;
      return address.length > maxLen ? '...' + address.slice(-maxLen) : address;
    };

    const handleApplyPriceFilter = () => {
      const min = parseFloat(tempMinPrice);
      const max = parseFloat(tempMaxPrice);
      
      if (tempMinPrice !== '' && tempMaxPrice !== '' && min > max) {
        Alert.alert('Lỗi', 'Giá tối thiểu không được lớn hơn giá tối đa');
        return;
      }
      
      setMinPrice(tempMinPrice);
      setMaxPrice(tempMaxPrice);
      setPriceFilterModalVisible(false);
    };

    const handleResetPriceFilter = () => {
      setTempMinPrice('');
      setTempMaxPrice('');
      setMinPrice('');
      setMaxPrice('');
      setPriceFilterModalVisible(false);
    };

    const openPriceFilterModal = () => {
      setTempMinPrice(minPrice);
      setTempMaxPrice(maxPrice);
      setPriceFilterModalVisible(true);
    };

    const hasActiveFilter = minPrice !== '' || maxPrice !== '';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
          {/* Fixed Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.locationContainer} 
                onPress={() => setAddressModalVisible(true)}
              >
                <Ionicons name="location" size={20} color="#000D66" />
                <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                  Giao đến: {getShortAddress(user?.address)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#000D66" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <TouchableOpacity 
                style={styles.searchBar}
                onPress={() => navigation.navigate('SearchScreen')}
              >
                <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
                <Text style={styles.searchText}>Tìm kiếm sản phẩm...</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButton, hasActiveFilter && styles.filterButtonActive]}
                onPress={openPriceFilterModal}
              >
                <Ionicons 
                  name="filter" 
                  size={20} 
                  color={hasActiveFilter ? '#fff' : '#000D66'} 
                />
                {hasActiveFilter && <View style={styles.filterDot} />}
              </TouchableOpacity>
            </View>
          </View>

        {/* Fixed Categories */}
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.categoryItem,
                  selectedTag === item.tag && styles.selectedCategoryItem
                ]}
                onPress={() => handleTag(item.tag)}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={24}
                    color={selectedTag === item.tag ? '#fff' : '#000D66'}
                />
                <Text style={[
                  styles.categoryText,
                  selectedTag === item.tag && styles.selectedCategoryText
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
            <View style={styles.favorite}>
              <TagComponent />
            </View>

            <View style={styles.furnitureContainer}>
              <Loading isLoading={loading} />
              {!loading && (
                filteredFurniture.length === 0 ? (
                  <View style={styles.noFurnitureContainer}>
                    <MaterialCommunityIcons name="sofa-outline" size={50} color="#9CA3AF" />
                    <Text style={styles.noFurnitureText}>Chờ cập nhật sản phẩm mới.</Text>
                  </View>
                ) : (
                  filteredFurniture.map((item) => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={styles.furnitureCard}
                      onPress={() => openModal(item)}
                    >
                      <View style={styles.imageContainer}>
                        <Image source={{ uri: item.image }} style={styles.furnitureImage} />
                        <OutOfStockBadge quantity={item.quantity} />
                        {/* Glass badge giảm giá góc trên bên phải */}
                        {item.discountPercentage > 0 && (
                          <View style={styles.discountBadgeContainer}>
                            <GlassDiscountBadge 
                              discountPercentage={item.discountPercentage} 
                              size="small"
                              glassIntensity="medium"
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.furnitureInfo}>
                        <Text style={styles.furnitureName}>{item.furnitureName}</Text>
                        <PriceDisplay 
                          originalPrice={item.furniturePrice}
                          discountPercentage={item.discountPercentage}
                          fontSize={16}
                          style={styles.priceContainer}
                        />
                        <View style={styles.tagContainer}>
                          {Array.isArray(item.tag) && item.tag.slice(0, 2).map((tag, index) => (
                            <TouchableOpacity 
                              key={index} 
                              style={[
                                styles.tag,
                                tag === selectedTag && styles.selectedTag
                              ]}
                              onPress={() => handleTag(tag)}
                            >
                              <Text style={[
                                styles.tagText,
                                tag === selectedTag && styles.selectedTagText
                              ]}>
                                {tag}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          {Array.isArray(item.tag) && item.tag.length > 2 && (
                            <View style={styles.moreTagIndicator}>
                              <Text style={styles.moreTagText}>+{item.tag.length - 2}</Text>
                            </View>
                          )}
                        </View>
                        
                      </View>
                      <AddFavorites 
                        product={{
                          id: item.id,
                          name: item.furnitureName,
                          price: Number(item.furniturePrice),
                          image: item.image,
                          tag: item.tag
                        }}
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          backgroundColor: '#fff',
                          padding: 6,
                          borderRadius: 20,
                          elevation: 12,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.5,
                          shadowRadius: 10,
                          zIndex: 10,
                        }}
                        iconSize={26}
                      />
                    </TouchableOpacity>
                  ))
                )
              )}
            </View>
          </ScrollView>

        {selectedFurniture && (
          <FurnitureItem
            visible={modalVisible}
            furnitureItem={selectedFurniture}
            userId={userId}
            onClose={closeModal}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* Modal hiển thị đầy đủ địa chỉ */}
        <Modal
          visible={addressModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAddressModalVisible(false)}
        >
          <View style={styles.addressModalOverlay}>
            <View style={styles.addressModalContent}>
              <Text style={styles.addressModalTitle}>Địa chỉ giao hàng</Text>
              <Text style={styles.addressModalText}>{user?.address || 'Chưa cập nhật địa chỉ'}</Text>
              <TouchableOpacity style={styles.addressModalCloseBtn} onPress={() => setAddressModalVisible(false)}>
                <Text style={styles.addressModalCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal lọc theo giá */}
        <Modal
          visible={priceFilterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPriceFilterModalVisible(false)}
        >
          <View style={styles.priceFilterModalOverlay}>
            <View style={styles.priceFilterModalContent}>
              <View style={styles.priceFilterHeader}>
                <Text style={styles.priceFilterTitle}>Lọc theo giá</Text>
                <TouchableOpacity onPress={() => setPriceFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.priceInputContainer}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Giá tối thiểu (đ)</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    value={tempMinPrice}
                    onChangeText={setTempMinPrice}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.priceSeparator}>
                  <View style={styles.priceLine} />
                </View>
                
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Giá tối đa (đ)</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Không giới hạn"
                    value={tempMaxPrice}
                    onChangeText={setTempMaxPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.quickPriceOptions}>
                <Text style={styles.quickPriceLabel}>Lựa chọn nhanh:</Text>
                <View style={styles.quickPriceButtons}>
                  <TouchableOpacity 
                    style={styles.quickPriceButton}
                    onPress={() => {
                      setTempMinPrice('0');
                      setTempMaxPrice('5000000');
                    }}
                  >
                    <Text style={styles.quickPriceButtonText}>Dưới 5 triệu</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickPriceButton}
                    onPress={() => {
                      setTempMinPrice('5000000');
                      setTempMaxPrice('10000000');
                    }}
                  >
                    <Text style={styles.quickPriceButtonText}>5-10 triệu</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickPriceButton}
                    onPress={() => {
                      setTempMinPrice('10000000');
                      setTempMaxPrice('20000000');
                    }}
                  >
                    <Text style={styles.quickPriceButtonText}>10-20 triệu</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickPriceButton}
                    onPress={() => {
                      setTempMinPrice('20000000');
                      setTempMaxPrice('');
                    }}
                  >
                    <Text style={styles.quickPriceButtonText}>Trên 20 triệu</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.priceFilterActions}>
                <TouchableOpacity 
                  style={styles.priceResetButton}
                  onPress={handleResetPriceFilter}
                >
                  <Text style={styles.priceResetButtonText}>Đặt lại</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.priceApplyButton}
                  onPress={handleApplyPriceFilter}
                >
                  <Text style={styles.priceApplyButtonText}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Chat Button */}
        <ChatButton />
      </SafeAreaView>
      <BottomNavigation cartItemCount={cartItems.length} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    flex: 1,
    minWidth: 0,
  },
  locationText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: '#000D66',
    fontWeight: '500',
    flexShrink: 1,
    minWidth: 0,
  },
  cartIcon: {
    position: 'relative',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 30,
    marginLeft: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#000D66',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 48,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#000D66',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '400',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
  },
  selectedCategoryItem: {
    backgroundColor: '#000D66',
  },
  categoryText: {
    marginTop: 8,
    fontSize: 13,
    color: '#000D66',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  favorite: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  furnitureContainer: {
    paddingHorizontal: 20,
  },
  noFurnitureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noFurnitureText: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  furnitureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0,
    minHeight: 150,
  },
  imageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    borderRadius: 15,
    overflow: 'hidden',
  },
  furnitureImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    resizeMode: 'cover',
  },
  furnitureInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'flex-start',
  },
  furnitureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000D66',
    marginBottom: 5,
  },
  furniturePrice: {
    fontSize: 16,
    color: '#000D66',
    fontWeight: '600',
    marginBottom: 10,
  },
  priceContainer: {
    marginBottom: 10,
  },
  discountBadgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 5,
    // Add subtle backdrop for better glass effect
    borderRadius: 10,
    overflow: 'hidden',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 5,
    borderWidth: 0,
  },
  selectedTag: {
    backgroundColor: '#000D66',
  },
  tagText: {
    fontSize: 12,
    color: '#000D66',
    fontWeight: '500',
  },
  selectedTagText: {
    color: '#fff',
  },
  moreTagIndicator: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 5,
  },
  moreTagText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 20,
  },
  addressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressModalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    maxHeight: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addressModalText: {
    fontSize: 14,
    color: '#000D66',
    marginBottom: 20,
  },
  addressModalCloseBtn: {
    backgroundColor: '#000D66',
    padding: 10,
    borderRadius: 20,
  },
  addressModalCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  priceFilterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  priceFilterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  priceFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  priceFilterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000D66',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  priceInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000D66',
    fontWeight: '600',
  },
  priceSeparator: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  priceLine: {
    width: 12,
    height: 2,
    backgroundColor: '#000D66',
  },
  quickPriceOptions: {
    marginBottom: 24,
  },
  quickPriceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  quickPriceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickPriceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickPriceButtonText: {
    fontSize: 13,
    color: '#000D66',
    fontWeight: '600',
  },
  priceFilterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  priceResetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  priceResetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  priceApplyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#000D66',
    alignItems: 'center',
  },
  priceApplyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default HomeScreen;