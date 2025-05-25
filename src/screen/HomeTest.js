import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import style from '../globals/style';
import globalStyles from '../globals/globalStyles';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

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

const featuredProducts = [
  {
    id: 1,
    name: 'Ghế Sofa Hiện Đại',
    image: require('../../assets/images/Sofa.png'),
    price: '12.000.000đ',
    tags: ['Phòng khách', 'Sofa'],
  },
  {
    id: 2,
    name: 'Bàn Ăn Gỗ Tự Nhiên',
    image: require('../../assets/images/banango.png'),
    price: '8.500.000đ',
    tags: ['Phòng bếp', 'Bàn ăn'],
  },
];

const HomeScreen = () => {
  const [selectedTag, setSelectedTag] = useState('Tất cả');
  const [likedProducts, setLikedProducts] = useState([]);

  const handleTag = (tag) => {
    setSelectedTag(tag === selectedTag ? 'Tất cả' : tag);
  };

  const toggleLike = (id) => {
    setLikedProducts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredProducts =
    selectedTag === 'Tất cả'
      ? featuredProducts
      : featuredProducts.filter((product) => product.tags?.includes(selectedTag));

  return (
    <SafeAreaView style={[globalStyles.safeArea, { backgroundColor: '#F8F9FA' }]}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Nội Thất Cao Cấp</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#666" />
          <TextInput
            placeholder="Tìm kiếm sản phẩm..."
            style={styles.searchInput}
            placeholderTextColor="#666"
          />
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Danh Mục Sản Phẩm</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                item.tag === selectedTag && styles.selectedCategoryItem
              ]}
              onPress={() => handleTag(item.tag)}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={32}
                color={item.tag === selectedTag ? '#fff' : '#000D66'}
              />
              <Text
                style={[
                  styles.categoryText,
                  item.tag === selectedTag && styles.selectedCategoryText
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Product List */}
        <Text style={styles.sectionTitle}>Sản Phẩm Nổi Bật</Text>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Image source={product.image} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{product.price}</Text>
                <View style={styles.tagContainer}>
                  {product.tags.map((tag, index) => (
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
              <TouchableOpacity 
                style={styles.likeButton}
                onPress={() => toggleLike(product.id)}
              >
                <MaterialCommunityIcons
                  name={likedProducts.includes(product.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={likedProducts.includes(product.id) ? '#000D66' : '#666'}
                />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noProductsText}>
            Không có sản phẩm phù hợp.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    color: '#000D66',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    height: 50,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 0,
  },
  searchInput: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
    color: '#000D66',
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000D66',
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    borderWidth: 0,
  },
  selectedCategoryItem: {
    backgroundColor: '#000D66',
  },
  categoryText: {
    marginTop: 8,
    fontSize: 13,
    color: '#000D66',
    fontWeight: '400',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 15,
  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000D66',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: '#000D66',
    fontWeight: '500',
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F8F9FA',
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
    fontWeight: '400',
  },
  selectedTagText: {
    color: '#fff',
  },
  likeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 20,
  },
  noProductsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 20,
  },
});

export default HomeScreen;
