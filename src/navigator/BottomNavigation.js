import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation,useRoute  } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

import React from 'react'
const tags = [
    { id: 'Home', name: 'Trang chủ', iconName: 'home-outline', iconSetName: 'home' },
    { id: 'Favorites', name: 'Yêu Thích', iconName: 'heart-outline', iconSetName: 'heart' },
    { id: 'SearchScreen', name: 'Tìm kiếm', iconName: 'search-outline', iconSetName: 'search' },
    { id: 'Profile', name: 'Tôi', iconName: 'person-circle-outline', iconSetName: 'person-circle' },
  ];
const BottomNavigation = () => {
    
    const navigation = useNavigation();
    const route = useRoute();
    const currentIndex = tags.findIndex(tag => tag.id === route.name);

    const renderTag = (item,index)=>{
        const isSelected = index === currentIndex ;
        const iconColor = isSelected ? '#000d66' : '#666';
        return (
            <TouchableOpacity
            key={item.id}
            style={styles.tag}
            onPress={()=> {
                navigation.navigate(item.id)}
            }
            >
            <View style={[styles.tag ,isSelected ] }>
            <Ionicons
                name= {isSelected ? item.iconSetName : item.iconName}
                size={26}
                color={iconColor}
            />
                <Text style={[styles.text, isSelected && styles.selectedText]}>
                    {item.name}
                </Text>
            </View>
            </TouchableOpacity>
          )
    }
    
    return <View style={styles.tags}>
        {
        tags.map(renderTag)
        }
    </View>
};

export default BottomNavigation

const styles = StyleSheet.create({
    tags: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 65,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingBottom: 5,
      },
      tag: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
      },
      text: {
        fontSize: 12,
        marginTop: 4,
        color: '#666',
      },
      selectedText:{
        color: '#000d66',
        fontWeight: '600',
    }
})