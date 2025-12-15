// Theme color schemes
export const themes = {
  romantic: {
    id: 'romantic',
    name: '浪漫粉金',
    nameEn: 'Romantic',
    description: '经典浪漫风格',
    icon: '💕',
    primary: '#D4AF37',
    secondary: '#F5D7DA',
    accent: '#F5E6D3',
    background: '#FFFEF9',
    text: '#5C4A3A',
    textLight: '#8B7355',
    gradientStart: '#F5D7DA',
    gradientEnd: '#F5E6D3'
  },
  elegant: {
    id: 'elegant',
    name: '优雅紫金',
    nameEn: 'Elegant',
    description: '高贵优雅风格',
    icon: '👑',
    primary: '#9B7ED9',
    secondary: '#E8D5F2',
    accent: '#F3E8FF',
    background: '#FAF8FF',
    text: '#4A3A5C',
    textLight: '#7A6B8A',
    gradientStart: '#E8D5F2',
    gradientEnd: '#F3E8FF'
  },
  fresh: {
    id: 'fresh',
    name: '清新蓝绿',
    nameEn: 'Fresh',
    description: '清新自然风格',
    icon: '🌊',
    primary: '#4ECDC4',
    secondary: '#B8E6E1',
    accent: '#E0F5F3',
    background: '#F0FDFC',
    text: '#2D5A55',
    textLight: '#5A8A85',
    gradientStart: '#B8E6E1',
    gradientEnd: '#E0F5F3'
  },
  warm: {
    id: 'warm',
    name: '温暖橙红',
    nameEn: 'Warm',
    description: '热情温暖风格',
    icon: '🔥',
    primary: '#FF6B6B',
    secondary: '#FFD4D4',
    accent: '#FFE8E8',
    background: '#FFF5F5',
    text: '#5C2A2A',
    textLight: '#8B5A5A',
    gradientStart: '#FFD4D4',
    gradientEnd: '#FFE8E8'
  },
  classic: {
    id: 'classic',
    name: '经典黑白',
    nameEn: 'Classic',
    description: '简约经典风格',
    icon: '⚫',
    primary: '#2C3E50',
    secondary: '#ECF0F1',
    accent: '#BDC3C7',
    background: '#FFFFFF',
    text: '#2C3E50',
    textLight: '#7F8C8D',
    gradientStart: '#ECF0F1',
    gradientEnd: '#BDC3C7'
  },
  dreamy: {
    id: 'dreamy',
    name: '梦幻粉紫',
    nameEn: 'Dreamy',
    description: '梦幻甜美风格',
    icon: '✨',
    primary: '#FF9FF3',
    secondary: '#FFD6F5',
    accent: '#FFEBF9',
    background: '#FFF5FC',
    text: '#5C2A4A',
    textLight: '#8B5A6A',
    gradientStart: '#FFD6F5',
    gradientEnd: '#FFEBF9'
  }
};

export const defaultTheme = themes.romantic;

export const getThemeById = (themeId) => {
  return themes[themeId] || defaultTheme;
};

export const getAllThemes = () => {
  return Object.values(themes);
};




