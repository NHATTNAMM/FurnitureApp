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
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import globalStyles from '../globals/globalStyles';
import { useNavigation } from '@react-navigation/native';
import BottomNavigation from '../navigator/BottomNavigation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialIcons, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Style from '../globals/style';
import TagComponent from '../component/TagComponent';
import { addToCart, loadFurnitureHome, removeFavoritesFurniture } from '../Firebase/FirebaseAPI';
import Loading from '../component/Loading';
import FurnitureItem from './FurnitureItem';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { UserContext } from '../Firebase/UserContext';
import AddFavorites from './Favorites/AddFavorites';

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
    const [fabPan] = useState(new Animated.ValueXY({ x: 0, y: 0 }));
    const panResponder = React.useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          fabPan.setOffset({ x: fabPan.x._value, y: fabPan.y._value });
        },
        onPanResponderMove: Animated.event(
          [null, { dx: fabPan.x, dy: fabPan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: () => {
          fabPan.flattenOffset();
        },
      })
    ).current;

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
      if (selectedTag === 'Tất cả'){
        setFilteredFurniture(furnitureData);
      } else if(selectedTag !== null) {
        const filtered = furnitureData.filter(item => Array.isArray(item.tag) && item.tag.includes(selectedTag));
        setFilteredFurniture(filtered);
      } else {
        setFilteredFurniture(furnitureData);
      }
    }, [selectedTag, furnitureData]); 
    
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
          {/* Animated Header */}
          <Animated.View style={[styles.header, { height: headerHeight }]}>
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
              {/* Đã ẩn icon giỏ hàng ở header */}
          </View>

          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => navigation.navigate('SearchScreen')}
          >
              <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
              <Text style={styles.searchText}>Tìm kiếm sản phẩm...</Text>
          </TouchableOpacity>
          </Animated.View>

        {/* Categories Section */}
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

        {/* Content Section */}
          <Animated.ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
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
                      <Image source={{ uri: item.image }} style={styles.furnitureImage} />
                      <View style={styles.furnitureInfo}>
                        <Text style={styles.furnitureName}>{item.furnitureName}</Text>
                        <Text style={styles.furniturePrice}>
                          {Number(item.furniturePrice).toLocaleString('vi-VN')} đ
                        </Text>
                        <View style={styles.tagContainer}>
                          {Array.isArray(item.tag) && item.tag.map((tag, index) => (
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
          </Animated.ScrollView>

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
      </SafeAreaView>
      {/* Nút giỏ hàng nổi (FAB) có thể kéo thả */}
      <Animated.View
        style={[
          styles.fabCart,
          { transform: fabPan.getTranslateTransform() }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="shopping-cart" size={28} color="#fff" />
          {cartItems.length > 0 && (
            <View style={styles.fabCartBadge}>
              <Text style={styles.fabCartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      <BottomNavigation />
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
    borderBottomWidth: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 50,
    marginBottom: 10,
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
    paddingVertical: 15,
    borderBottomWidth: 0,
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
    paddingVertical: 15,
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
  },
  furnitureImage: {
    width: 120,
    height: 120,
    borderRadius: 15,
  },
  furnitureInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
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
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  fabCart: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    backgroundColor: '#000D66',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 100,
  },
  fabCartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ff5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  fabCartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;