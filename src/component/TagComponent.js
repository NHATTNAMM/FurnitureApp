import { StyleSheet, Text, View,TouchableOpacity, Image } from 'react-native'
import React from 'react'
import Swiper from 'react-native-swiper'
import { useNavigation } from '@react-navigation/native'

const tagData = [
  {
    id:'1', name: 'Bộ bàn ghế hiện đại' , Image: require('../../assets/images/Tag/tablec.jpg')
  },
  {
    id:'2' ,name: 'Bàn học', Image: require('../../assets/images/Tag/table.jpg')
  },
  {
    id:'3' ,name: 'Tủ sách', Image: require('../../assets/images/Tag/bookcase.jpg')
  },
  {
    id:'4' ,name: 'Giường đa năng', Image: require('../../assets/images/Tag/bed.jpg')
  },
]

const TagComponent = () => {
  const navigation = useNavigation();

  const handleSeeAll = () => {
    navigation.navigate('BestSellingProducts', { products: tagData });
  };

  return (
    <View>
    <View style={styles.favorite}>
        <Text style={styles.favoriteTxt}>Sản phẩm bán chạy</Text>
        <TouchableOpacity onPress={handleSeeAll}>
        <Text style={styles.seaAll}>Tất cả</Text>
        </TouchableOpacity>
    </View>
        <View style={styles.swiperContainer}>
          <Swiper  
          autoplay={true}
          showsPagination={false}
          dotColor="#ccc"
          activeDotColor="#077f7b"
          height={200}>
            {/* <View style={styles.box}> */}
            {tagData.map((item) =>
            (
              <View key={item.id} style={styles.slide}>
                <View style={styles.imageBox}>
                <Image source={item.Image} style={styles.image}/>
                
                <Text style={styles.imageText}>{item.name}</Text>
                </View>
              </View>
            )
            )}
            {/* </View> */}
          </Swiper>
        </View>
    </View>
  )
}

export default TagComponent

const styles = StyleSheet.create({
  favorite:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems: 'center',
    paddingHorizontal:10,
    marginTop:10,
    
  },
  seaAll:{
    color: '#000d66',
    fontStyle: 'italic',
    fontSize: 14,

  },
  favoriteTxt:{
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
   
  },
  swiperContainer:{
    paddingHorizontal: 10,
    marginTop: 10,
  },
  slide:{
    paddingHorizontal:5,
  },
  image: {
    marginTop:20,
    width: '100%',
    height: 150,
    borderRadius: 12,
    
  },
  imageText: {
    marginTop: 8,
    fontSize: 16,
    color: '#fffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  imageBox: {
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor:'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    width:'100%',
    elevation: 10,
  },

})