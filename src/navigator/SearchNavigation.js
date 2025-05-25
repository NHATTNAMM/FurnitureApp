import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import React from 'react';
import { MaterialIcons, Feather } from '@expo/vector-icons';

const SearchNavigation = () => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm kiếm sản phẩm"
          style={styles.input}
          placeholderTextColor="#888"
        />
      </View>
      <TouchableOpacity style={styles.cartIcon}>
        <MaterialIcons name="shopping-cart" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
};

export default SearchNavigation;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ff5722',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  cartIcon: {
    marginLeft: 10,
  },
});
