import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PriceDisplay = ({ 
    originalPrice, 
    discountPercentage = 0, 
    style = {},
    originalPriceStyle = {},
    discountedPriceStyle = {},
    showOriginal = true,
    fontSize = 16
}) => {
    const hasDiscount = discountPercentage > 0;
    const discountedPrice = hasDiscount 
        ? originalPrice * (1 - discountPercentage / 100) 
        : originalPrice;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
        }).format(price);
    };

    if (!hasDiscount) {
        // Không có giảm giá, chỉ hiển thị giá gốc
        return (
            <View style={[styles.container, style]}>
                <Text style={[styles.price, { fontSize }, discountedPriceStyle]}>
                    {formatPrice(originalPrice)}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            {showOriginal && (
                <Text style={[
                    styles.originalPrice, 
                    { fontSize: fontSize * 0.85 }, 
                    originalPriceStyle
                ]}>
                    {formatPrice(originalPrice)}
                </Text>
            )}
            <Text style={[
                styles.discountedPrice, 
                { fontSize }, 
                discountedPriceStyle
            ]}>
                {formatPrice(discountedPrice)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    originalPrice: {
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        marginRight: 8,
        fontWeight: '400',
    },
    discountedPrice: {
        color: '#000D66',
        fontWeight: '600',
    },
    price: {
        color: '#000D66',
        fontWeight: '600',
    },
});

export default PriceDisplay;
