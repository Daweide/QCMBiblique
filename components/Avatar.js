import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Avatar = ({ name, size = 40, textSize = 16, whiteShadow = false, noShadow = false }) => {
  // Générer les initiales
  const getInitials = (fullName) => {
    if (!fullName || fullName.trim() === '') return '?';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + (names[1] ? names[1][0] : '')).toUpperCase();
  };

  // Générer une couleur basée sur le nom
  const getColorFromName = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#FF6348', '#2ED573', '#3742FA', '#F8B500', '#FF6B9D',
      '#C44569', '#F8B500', '#3D5A80', '#EE5A6F', '#06FFA5'
    ];
    
    if (!name) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const initials = getInitials(name);
  const backgroundColor = getColorFromName(name);

  return (
    <View style={[
      styles.avatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor
      },
      whiteShadow && styles.whiteShadow,
      noShadow && styles.noShadow
    ]}>
      <Text style={[
        styles.initials,
        { fontSize: textSize }
      ]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  whiteShadow: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  noShadow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
});

export default Avatar;