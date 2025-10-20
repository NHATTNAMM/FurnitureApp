import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GlassDiscountBadge = ({ 
    discountPercentage, 
    style = {},
    textStyle = {},
    size = 'medium',
    glassIntensity = 'medium' // low, medium, high
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
                    borderRadius: 8,
                    minWidth: 32,
                };
            case 'large':
                return {
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    fontSize: 13,
                    borderRadius: 10,
                    minWidth: 48,
                };
            default: // medium
                return {
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    fontSize: 11,
                    borderRadius: 9,
                    minWidth: 40,
                };
        }
    };

    const getGlassStyle = () => {
        switch (glassIntensity) {
            case 'low':
                return {
                    backgroundColor: 'rgba(255, 87, 34, 0.65)', // Đỏ cam nhạt
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                };
            case 'high':
                return {
                    backgroundColor: 'rgba(255, 87, 34, 0.85)', // Đỏ cam đậm
                    borderColor: 'rgba(255, 255, 255, 0.45)',
                };
            default: // medium
                return {
                    backgroundColor: 'rgba(255, 87, 34, 0.75)', // Đỏ cam vừa
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                };
        }
    };

    const sizeStyle = getSize();
    const glassStyle = getGlassStyle();

    return (
        <View style={[
            styles.container,
            style
        ]}>
            {/* Background blur effect */}
            <View style={[
                styles.blurBackground,
                {
                    borderRadius: sizeStyle.borderRadius,
                }
            ]} />
            
            {/* Main badge */}
            <View style={[
                styles.badge,
                {
                    paddingHorizontal: sizeStyle.paddingHorizontal,
                    paddingVertical: sizeStyle.paddingVertical,
                    borderRadius: sizeStyle.borderRadius,
                    minWidth: sizeStyle.minWidth,
                    backgroundColor: glassStyle.backgroundColor,
                    borderColor: glassStyle.borderColor,
                }
            ]}>
                <Text style={[
                    styles.text, 
                    { fontSize: sizeStyle.fontSize },
                    textStyle
                ]}>
                    -{Math.round(discountPercentage)}%
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    blurBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.05)', // Giảm độ đậm của blur background
        // Simulated backdrop filter
    },
    badge: {
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // Enhanced glass effect với màu đỏ cam
        shadowColor: 'rgba(255, 87, 34, 0.4)',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.45,
        shadowRadius: 5,
        elevation: 6,
        // Inner highlight for glass effect
        position: 'relative',
    },
    text: {
        color: '#FFFFFF', // Chữ trắng để nổi bật trên nền đỏ cam
        fontWeight: '800',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        letterSpacing: 0.5,
        // Add slight glow với màu đỏ cam
        shadowColor: 'rgba(255, 87, 34, 0.3)',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 1,
    },
});

export default GlassDiscountBadge;
