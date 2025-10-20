import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DiscountBadge = ({ 
    discountPercentage, 
    style = {},
    textStyle = {},
    size = 'medium' // small, medium, large
}) => {
    if (!discountPercentage || discountPercentage <= 0) {
        return null;
    }

    const getSize = () => {
        switch (size) {
            case 'small':
                return {
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    fontSize: 9,
                    borderRadius: 6,
                };
            case 'large':
                return {
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    fontSize: 12,
                    borderRadius: 8,
                };
            default: // medium
                return {
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    fontSize: 10,
                    borderRadius: 7,
                };
        }
    };

    const sizeStyle = getSize();

    return (
        <View style={[
            styles.badge,
            {
                paddingHorizontal: sizeStyle.paddingHorizontal,
                paddingVertical: sizeStyle.paddingVertical,
                borderRadius: sizeStyle.borderRadius,
            },
            style
        ]}>
            <Text style={[
                styles.text, 
                { fontSize: sizeStyle.fontSize },
                textStyle
            ]}>
                -{Math.round(discountPercentage)}%
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        backgroundColor: 'rgba(255, 87, 34, 0.75)', // Đỏ cam nổi bật với alpha 75%
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.4)', // Subtle white border
        justifyContent: 'center',
        alignItems: 'center',
        // Glass effect shadows
        shadowColor: 'rgba(255, 87, 34, 0.3)',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        // Backdrop blur simulation with overlay
        overflow: 'hidden',
    },
    text: {
        color: '#FFFFFF', // Chữ trắng để nổi bật trên nền đỏ cam
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        letterSpacing: 0.3,
    },
});

export default DiscountBadge;
