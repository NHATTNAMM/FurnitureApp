import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const CustomCheckbox = ({ value, onValueChange, tintColor = '#000D66', style }) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.checkbox,
        { borderColor: value ? tintColor : '#9CA3AF' },
        value && { backgroundColor: tintColor }
      ]}>
        {value && (
          <MaterialIcons name="check" size={18} color="#FFF" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export default CustomCheckbox;
