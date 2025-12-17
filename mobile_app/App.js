import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import Constants from 'expo-constants';
import { themes, defaultTheme } from './src/utils/themes';
import realApi from './src/services/realApi';
import { toBoolean } from './src/utils/booleanUtils';
import ApiTestScreen from './src/screens/ApiTestScreen';
import RSVPScreen from './src/screens/RSVPScreen';
import LoginScreen from './src/screens/LoginScreen';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';

const { width } = Dimensions.get('window');

// Helper: download image to device gallery using Expo FileSystem + MediaLibrary
const downloadImageToGallery = async (imageUrl, fallbackName = 'photo') => {
  try {
    // In Expo Go we can't control AndroidManifest permissions, so avoid calling native APIs
    if (Constants.appOwnership === 'expo') {
      Alert.alert('Download', 'To save photos directly, please run a development/production build instead of Expo Go.');
      return;
    }

    if (!imageUrl) {
      Alert.alert('错误', '没有可下载的图片');
      return;
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('错误', '请允许应用访问相册以保存图片');
      return;
    }

    const fileName =
      imageUrl.split('/').pop() || `${fallbackName}-${Date.now()}.jpg`;
    const localUri = FileSystem.documentDirectory + fileName;

    const result = await FileSystem.downloadAsync(imageUrl, localUri);
    await MediaLibrary.saveToLibraryAsync(result.uri);

    Alert.alert('成功', '照片已保存到相册');
  } catch (error) {
    console.error('[Download] error:', error);
    // Graceful message if specific AUDIO permission error occurs
    const msg = String(error?.message || '');
    if (msg.includes('AUDIO permission')) {
      Alert.alert('错误', '当前构建未声明音频存储权限，无法直接保存图片。请使用正式打包的应用再次尝试。');
    } else {
      Alert.alert('错误', '保存照片失败，请稍后重试');
    }
  }
};

// Helper: simple relative time (English only for now)
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} d ago`;
  return d.toISOString().slice(0, 10);
};

// Theme Context
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

// Theme Provider
const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);

  useEffect(() => {
    console.log('[ThemeProvider] mounted, loading theme');
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const themeId = await AsyncStorage.getItem('@wedding_theme');
      console.log('[ThemeProvider] loaded theme id:', themeId);
      setCurrentTheme(themes[themeId] || defaultTheme);
      console.log('set current theme')
    } catch (e) {
      console.log('[ThemeProvider] getTheme ERROR, using defaultTheme:', e);
      setCurrentTheme(defaultTheme);
    }
  };

  const changeTheme = async (themeId) => {
    try {
      console.log('[ThemeProvider] changeTheme called with:', themeId);
      await AsyncStorage.setItem('@wedding_theme', themeId);
      setCurrentTheme(themes[themeId] || defaultTheme);
    } catch (e) {
      console.log('[ThemeProvider] changeTheme ERROR:', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Splash Screen
const SplashScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [weddingInfo, setWeddingInfo] = useState({ groomShortName: 'JS', brideShortName: 'PS', date: '2026-01-04' });
  
  // Load wedding type on mount to set default
  useEffect(() => {
    const setDefaultInfo = async () => {
      try {
        const weddingType = await AsyncStorage.getItem('wedding_type');
        if (weddingType === 'bride') {
          setWeddingInfo({ groomShortName: 'JS', brideShortName: 'PS', date: '2026-01-02' });
        }
      } catch (e) {
        // Ignore
      }
    };
    setDefaultInfo();
  }, []);

  useEffect(() => {
    console.log('[Splash] mounted (decide Login/Main)');

    // Load wedding info silently (non-blocking, don't log errors)
    const loadData = async () => {
      try {
        // Get wedding_type from storage if available
        const weddingType = await AsyncStorage.getItem('wedding_type');
        const info = await Promise.race([
          realApi.getWeddingInfo(weddingType),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
        if (info && info.groomShortName) {
          setWeddingInfo(info);
        }
      } catch (e) {
        // Silently use defaults - don't log network errors during splash
        // This is expected if API is not running or endpoint doesn't exist yet
      }
    };

    const decideNext = async () => {
      try {
        const phone = await AsyncStorage.getItem('user_phone');
        if (phone) {
          console.log('[Splash] found stored user_phone, go Main');
          navigation.replace('Main');
        } else {
          console.log('[Splash] no stored user_phone, go Login');
          navigation.replace('Login');
        }
      } catch (e) {
        console.log('[Splash] error checking user_phone, go Login', e);
        navigation.replace('Login');
      }
    };

    // Load data in background, don't wait for it
    loadData().catch(() => {}); // Silent catch
    
    const timer = setTimeout(decideNext, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={[styles.splashContainer, { backgroundColor: theme.gradientStart }]}>
      <Text style={styles.splashLogo}>💒</Text>
      <Text style={[styles.splashTitle, { color: theme.text }]}>
        {weddingInfo.groomShortName || 'JS'} ♥ {weddingInfo.brideShortName || 'PS'}
      </Text>
      <Text style={[styles.splashSubtitle, { color: theme.textLight }]}>Wedding Celebration</Text>
      <Text style={styles.splashHearts}>💕 💕 💕</Text>
      <ActivityIndicator size="small" color={theme.textLight} style={{ marginTop: 20 }} />
    </View>
  );
};

// Safe Mode Screen (Android debugging)
// Keep this UI extremely simple to avoid any boolean/string prop issues.
const SafeModeScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000000' }}>Safe Mode</Text>
      <Text style={{ marginTop: 8, color: '#555555', textAlign: 'center', paddingHorizontal: 24 }}>
        If you can see this on Android, navigation and basic views are working.
      </Text>
    </View>
  );
};

// Home Screen
const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [weddingInfo, setWeddingInfo] = useState({ groomShortName: 'JS', brideShortName: 'PS', date: '2026-01-04', venue: 'Starview Restaurant', time: '18:00' });
  const [weddingTypeState, setWeddingTypeState] = useState(null);
  
  // Load wedding type on mount to set default
  useEffect(() => {
    const setDefaultInfo = async () => {
      try {
        const weddingType = await AsyncStorage.getItem('wedding_type');
        if (weddingType === 'bride') {
          setWeddingInfo({ groomShortName: 'JS', brideShortName: 'PS', date: '2026-01-02', venue: 'Fu Hotel', time: '18:00' });
        }
      } catch (e) {
        // Ignore
      }
    };
    setDefaultInfo();
  }, []);

  // Calculate countdown to wedding date and time
  const calculateCountdown = (weddingDate, weddingTime = '18:00') => {
    try {
      // Parse wedding date and time
      const [datePart, timePart] = weddingDate.includes('T') ? weddingDate.split('T') : [weddingDate, weddingTime];
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours = 18, minutes = 0] = (timePart || weddingTime || '18:00').split(':').map(Number);
      
      // Create wedding date/time
      const weddingDateTime = new Date(year, month - 1, day, hours, minutes, 0);
      const now = new Date();
      
      // Calculate difference
      const diff = weddingDateTime - now;
      
      if (diff <= 0) {
        // Wedding has passed
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secondsRemaining = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { days, hours: hoursRemaining, minutes: minutesRemaining, seconds: secondsRemaining };
    } catch (error) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
  };

  useEffect(() => {
    console.log('[Home] mounted');
    const loadInfo = async () => {
      try {
        // Get wedding_type from storage to load correct wedding info
        const weddingType = await AsyncStorage.getItem('wedding_type');
        if (weddingType) {
          setWeddingTypeState(weddingType);
        }
        const info = await Promise.race([
          realApi.getWeddingInfo(weddingType),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
        if (info && info.groomShortName) {
          setWeddingInfo(info);
        }
      } catch (e) {
        // Silently use defaults - API might not be available
      }
    };
    loadInfo();
    return () => console.log('[Home] unmounted');
  }, []);

  // Update countdown every second
  useEffect(() => {
    // Initial calculation
    setCountdown(calculateCountdown(weddingInfo.date, weddingInfo.time));
    
    // Update every second
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(weddingInfo.date, weddingInfo.time));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [weddingInfo.date, weddingInfo.time]);

  const features = [
    { icon: '👔', title: t('home.feature.groomTitle'), desc: t('home.feature.groomDesc'), screen: 'GroomProfile' },
    { icon: '👰', title: t('home.feature.brideTitle'), desc: t('home.feature.brideDesc'), screen: 'BrideProfile' },
    { icon: '🪑', title: t('seat.title'), desc: t('seat.pending'), screen: 'Seats', tab: true },
    { icon: '📅', title: t('home.feature.timelineTitle'), desc: t('home.feature.timelineDesc'), screen: 'Timeline' }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <StatusBar barStyle="dark-content" hidden={Boolean(false)} translucent={Boolean(false)} />
      <ScrollView showsVerticalScrollIndicator={Boolean(false)} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: theme.gradientStart }]}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            {weddingInfo.groomShortName || 'JS'} ♥ {weddingInfo.brideShortName || 'PS'}
          </Text>
          <Text style={[styles.heroDate, { color: theme.primary }]}>{weddingInfo.date || '2026-01-04'}</Text>
          <Text style={[styles.heroLocation, { color: theme.textLight }]}>
            📍 {weddingInfo.venue || 'Starview Restaurant'}
          </Text>
        </View>

        {/* Countdown */}
        <View style={[styles.countdownBox, { backgroundColor: '#fff' }]}>
          <Text style={[styles.countdownTitle, { color: theme.textLight }]}>{t('home.countdownTitle')}</Text>
          <View style={styles.countdownGrid}>
            {[
              { value: countdown.days, label: t('home.countdown.days') },
              { value: countdown.hours, label: t('home.countdown.hours') },
              { value: countdown.minutes, label: t('home.countdown.minutes') },
              { value: countdown.seconds, label: t('home.countdown.seconds') }
            ].map((item, index) => (
              <View key={index} style={styles.countdownItem}>
                <Text style={[styles.countdownNumber, { color: theme.primary }]}>{item.value}</Text>
                <Text style={[styles.countdownLabel, { color: theme.textLight }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* RSVP Buttons */}
        <View style={styles.rsvpSection}>
          <Text style={[styles.homeSectionTitle, { color: theme.text }]}>{t('home.confirmAttendance')}</Text>
          {(weddingTypeState === null || weddingTypeState === 'bride') && (
            <TouchableOpacity
              style={[styles.rsvpButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('RSVP', { type: 'bride' })}
            >
              <Text style={styles.rsvpButtonText}>👰 {t('home.brideRsvp')}</Text>
            </TouchableOpacity>
          )}
          {(weddingTypeState === null || weddingTypeState === 'groom') && (
            <TouchableOpacity
              style={[styles.rsvpButton, { backgroundColor: theme.accent }]}
              onPress={() => navigation.navigate('RSVP', { type: 'groom' })}
            >
              <Text style={styles.rsvpButtonText}>👔 {t('home.groomRsvp')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.featureCard, { backgroundColor: '#fff' }]}
              onPress={() => {
                if (feature.tab) {
                  // Navigate to tab screen
                  navigation.navigate('Main', { screen: feature.screen });
                } else {
                  navigation.navigate(feature.screen);
                }
              }}
              activeOpacity={0.7}
              disabled={Boolean(false)}
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
              <Text style={[styles.featureDesc, { color: theme.textLight }]}>{feature.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Groom Profile Screen
const GroomProfileScreen = () => {
  const { theme } = useTheme();
  const [profile, setProfile] = useState({ name: 'Dr. Ang Jin Sheng', role: 'The Groom', avatar: '👔', occupation: '软件工程师', hobbies: '摄影、旅行、阅读', bio: '热爱生活，享受每一个美好瞬间。' });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await realApi.getGroomProfile();
        if (data) setProfile(data);
      } catch (e) {
        // Silently use defaults
      }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={[styles.personHeader, { backgroundColor: theme.gradientStart }]}>
          <View style={styles.personAvatar}>
            <Text style={styles.personAvatarText}>{profile.avatar}</Text>
          </View>
          <Text style={[styles.personName, { color: theme.text }]}>{profile.name}</Text>
          <Text style={[styles.personRole, { color: theme.textLight }]}>{profile.role}</Text>
        </View>
        <View style={styles.personInfo}>
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: theme.textLight }]}>职业</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{profile.occupation}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.secondary }]} />
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: theme.textLight }]}>兴趣爱好</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{profile.hobbies}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.secondary }]} />
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: theme.textLight }]}>个人简介</Text>
            <Text style={[styles.infoValue, { color: theme.text, lineHeight: 24 }]}>{profile.bio}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Bride Profile Screen
const BrideProfileScreen = () => {
  const { theme } = useTheme();
  const [profile, setProfile] = useState({ name: 'Miss Ong Pei Shi', role: 'The Bride', avatar: '👰', occupation: '设计师', hobbies: '绘画、音乐、美食', bio: '充满创意和热情，喜欢用艺术表达情感。' });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await realApi.getBrideProfile();
        if (data) setProfile(data);
      } catch (e) {
        // Silently use defaults
      }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={[styles.personHeader, { backgroundColor: theme.gradientStart }]}>
          <View style={styles.personAvatar}>
            <Text style={styles.personAvatarText}>{profile.avatar}</Text>
          </View>
          <Text style={[styles.personName, { color: theme.text }]}>{profile.name}</Text>
          <Text style={[styles.personRole, { color: theme.textLight }]}>{profile.role}</Text>
        </View>
        <View style={styles.personInfo}>
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: theme.textLight }]}>职业</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{profile.occupation}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.secondary }]} />
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: theme.textLight }]}>兴趣爱好</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{profile.hobbies}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.secondary }]} />
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: theme.textLight }]}>个人简介</Text>
            <Text style={[styles.infoValue, { color: theme.text, lineHeight: 24 }]}>{profile.bio}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Photo Feed Screen
const PhotoFeedScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      const response = await realApi.getPhotos(1, 20, userPhone);
      const data = Array.isArray(response) ? response : (response.photos || []);

      // Map API response (photos table) to UI shape
      const photoItems = data.map(photo => {
        const p = { ...photo };

        // Backend field names → UI field names
        p.id = photo.id;
        p.userName = photo.user_name || 'Guest';
        p.userAvatar = (photo.user_name && photo.user_name[0]) || '👤';
        p.type = 'photo';
        p.createdAt = photo.created_at;

        // Build full image URL if needed
        if (photo.image_url && photo.image_url.startsWith('/')) {
          // Use API base URL (without /api) for uploads
          const baseUrl = realApi?.apiBaseUrl || '';
          p.imageUrl = `${baseUrl}${photo.image_url}`;
        } else {
          p.imageUrl = photo.image_url || photo.imageUrl || '';
        }

        // Tags: backend returns array of objects { id, name }
        if (Array.isArray(photo.tags)) {
          p.tags = photo.tags.map(t => t.name || t);
        } else {
          p.tags = [];
        }

        // Likes and comments counts
        p.likes = photo.likes_count != null ? photo.likes_count : (photo.likes || 0);
        p.totalComments = photo.comments_count != null ? photo.comments_count : (photo.totalComments || 0);

        // Flags
        p.likedByMe = toBoolean(photo.liked || photo.likedByMe);
        p.savedByMe = toBoolean(photo.savedByMe);

        if (p.comments) {
          p.comments = p.comments.map(c => ({
            ...c,
            likedByMe: toBoolean(c.likedByMe)
          }));
        }

        return p;
      });

      const combined = [...photoItems].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      setPhotos(combined);
      setLoading(false);
    } catch (error) {
      // Silently handle network errors - API might not be available
      setPhotos([]);
      setLoading(false);
    }
  };

  const handleLike = async (photoId) => {
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      if (!userPhone) {
        Alert.alert('Error', 'Please login first');
        return;
      }
      const result = await realApi.likePhoto(photoId, userPhone);
      setPhotos(photos.map(p => {
        if (p.type !== 'photo' || p.id !== photoId) return p;
        return {
          ...p,
          likedByMe: toBoolean(result.likedByMe),
          likes: typeof result.likes === 'number' ? result.likes : p.likes,
        };
      }));
    } catch (error) {
      // Silently handle error
    }
  };

  const handleSave = async (photoId) => {
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      if (!userPhone) {
        Alert.alert('Error', 'Please login first');
        return;
      }
      const result = await realApi.toggleSavePhoto(photoId, userPhone);
      setPhotos(photos.map(p => {
        if (p.type !== 'photo' || p.id !== photoId) return p;
        return {
          ...p,
          savedByMe: toBoolean(result.savedByMe),
        };
      }));
    } catch (error) {
      // Silently handle error
    }
  };

  const handleDelete = async (item) => {
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      if (!userPhone) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      Alert.alert(
        '删除',
        '确定要删除这条内容吗？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              try {
                await realApi.deletePhoto(item.id, userPhone);
                setPhotos(prev => prev.filter(p => !(p.type === item.type && p.id === item.id)));
              } catch (error) {
                const msg =
                  error?.response?.data?.message ||
                  (error?.response?.status === 403
                    ? '只能删除自己上传的内容'
                    : '删除失败，请稍后重试');
                Alert.alert('错误', msg);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (e) {
      Alert.alert('错误', '删除失败，请稍后重试');
    }
  };

  const handleMoreActions = (item) => {
    const buttons = [];

    if (item.type === 'photo' && item.imageUrl) {
      buttons.push({
        text: '下载照片',
        onPress: () => downloadImageToGallery(item.imageUrl, `photo-${item.id}`),
      });
    }

    buttons.push({
      text: '删除',
      style: 'destructive',
      onPress: () => handleDelete(item),
    });

    buttons.push({
      text: '取消',
      style: 'cancel',
    });

    Alert.alert('更多操作', '', buttons, { cancelable: true });
  };

  const renderPhoto = ({ item }) => {
    return (
      <View style={styles.photoPost}>
        {/* Header */}
        <View style={styles.postHeader}>
          <Text style={styles.postAvatar}>{item.userAvatar}</Text>
          <View style={styles.postUser}>
            <Text style={[styles.postUsername, { color: theme.text }]}>{item.userName}</Text>
            <Text style={[styles.postTime, { color: theme.textLight }]}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => handleMoreActions(item)}>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.textLight} />
          </TouchableOpacity>
        </View>

        {/* Media */}
        {console.log('[FEED] imageUrl', item.id, item.imageUrl)}
        <TouchableOpacity
          style={[styles.postImage, { backgroundColor: theme.gradientStart }]}
          onPress={() => navigation.navigate('PhotoDetail', { photo: item })}
          activeOpacity={0.7}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.postImageImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.postImageEmoji}>No Image</Text>
          )}
          <View style={styles.postImageOverlay}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tagBadgeOverlay}>
                <Text style={[styles.tagBadgeText, { color: theme.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Actions / likes / caption */}
        <View style={styles.postActions}>
          <TouchableOpacity onPress={() => handleLike(item.id)}>
            <Ionicons
              name={toBoolean(item.likedByMe) ? 'heart' : 'heart-outline'}
              size={28}
              color={toBoolean(item.likedByMe) ? '#e91e63' : theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('PhotoDetail', { photo: item })}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="chatbubble-outline" size={26} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => handleSave(item.id)}>
            <Ionicons
              name={toBoolean(item.savedByMe) ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color={toBoolean(item.savedByMe) ? theme.primary : theme.text}
            />
          </TouchableOpacity>
        </View>

        {/* Likes & caption */}
        <Text style={[styles.postLikes, { color: theme.text }]}>{item.likes} 个赞</Text>
        <View style={styles.postCaption}>
          <Text style={[styles.postCaptionText, { color: theme.text }]}>
            <Text style={{ fontWeight: 'bold' }}>{item.userName} </Text>
            {item.caption}
          </Text>
        </View>

        {/* Comments link */}
        {item.totalComments > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('PhotoDetail', { photo: item })}
            style={styles.postComments}
          >
            <Text style={[styles.viewComments, { color: theme.textLight }]}>
              查看全部 {item.totalComments} 条评论
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={item => `${item.type || 'photo'}-${item.id}`}
        showsVerticalScrollIndicator={Boolean(false)}
        removeClippedSubviews={Boolean(false)}
      />
    </SafeAreaView>
  );
};

// Helper to build full image URL from API fields
const buildImageUrl = (raw) => {
  if (!raw) return '';
  if (raw.startsWith('http')) return raw;

  const base = (realApi?.apiBaseUrl || '').replace(/\/api\/?$/, '');
  if (!base) return raw;

  if (raw.startsWith('/')) return `${base}${raw}`;
  return `${base}/${raw}`;
};

// Photo Detail Screen (with comments)
const PhotoDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const [photo, setPhoto] = useState(() => {
    const p = route.params.photo || {};
    return {
      ...p,
      imageUrl: buildImageUrl(p.imageUrl || p.image_url),
      likedByMe: toBoolean(p.likedByMe),
      savedByMe: toBoolean(p.savedByMe),
      comments: (p.comments || []).map(c => ({
        ...c,
        likedByMe: toBoolean(c.likedByMe)
      })),
    };
  });
  const [commentText, setCommentText] = useState('');

  const loadFullPhoto = async () => {
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      const [photoResponse, commentsResponse] = await Promise.all([
        realApi.getPhoto(photo.id, userPhone),
        realApi.getComments(photo.id, 1, 100, userPhone),
      ]);

      const photoData = photoResponse.photo || photoResponse || {};
      const commentsData = commentsResponse.comments || commentsResponse || [];

      const commentsArray = Array.isArray(commentsData)
        ? commentsData
        : Array.isArray(commentsData.comments)
        ? commentsData.comments
        : [];

      const mappedComments = commentsArray.map(c => ({
        id: c.id,
        userName: c.user_name || c.userName || 'Guest',
        text: c.text,
        likes: c.likes_count != null ? c.likes_count : 0,
        likedByMe: toBoolean(c.liked || c.likedByMe),
        createdAt: c.created_at,
      }));

      setPhoto(prev => {
        const next = {
          // keep what we already had from the feed (userName, avatar, etc.)
          ...prev,
          // normalize/refresh image URL from latest data
          imageUrl: buildImageUrl(photoData.image_url || photoData.imageUrl || prev.imageUrl),
          // overlay with fresh counts/basic fields from backend if present
          likes: photoData.likes_count != null ? photoData.likes_count : (photoData.likes ?? prev.likes),
          totalComments:
            photoData.comments_count != null
              ? photoData.comments_count
              : (photoData.totalComments ?? prev.totalComments),
          createdAt: prev?.createdAt || photoData.created_at || prev?.createdAt,
          comments: mappedComments,
        };
        return normalizePhoto(next);
      });
    } catch (error) {
      // ignore load errors; keep existing state
    }
  };

  useEffect(() => {
    loadFullPhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizePhoto = (p) => ({
    ...p,
    likedByMe: toBoolean(p.likedByMe),
    savedByMe: toBoolean(p.savedByMe),
    comments: p.comments ? p.comments.map(c => ({
      ...c,
      likedByMe: toBoolean(c.likedByMe)
    })) : []
  });

  const handleLike = async () => {
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      if (!userPhone) {
        Alert.alert('Error', 'Please login first');
        return;
      }
      const result = await realApi.likePhoto(photo.id, userPhone);
      setPhoto(prev => ({
        ...prev,
        likedByMe: toBoolean(result.likedByMe),
        likes: typeof result.likes === 'number' ? result.likes : prev.likes,
      }));
    } catch (error) {
      // Silently handle error
    }
  };

  const handleSave = async () => {
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      if (!userPhone) {
        Alert.alert('Error', 'Please login first');
        return;
      }
      const result = await realApi.toggleSavePhoto(photo.id, userPhone);
      setPhoto(prev => ({
        ...prev,
        savedByMe: toBoolean(result.savedByMe),
      }));
    } catch (error) {
      // silently ignore
    }
  };

  const handleDownload = async () => {
    if (!photo.imageUrl) {
      Alert.alert('错误', '没有可下载的图片');
      return;
    }
    Alert.alert('提示', '请长按图片或使用系统截图功能保存到相册。');
  };

  const handleAddComment = async () => {
    if (commentText.trim()) {
      try {
        const userPhone = await AsyncStorage.getItem('user_phone');
        if (!userPhone) {
          Alert.alert('Error', 'Please login first');
          return;
        }
        await realApi.addComment(photo.id, null, userPhone, commentText);
        // Reload full photo with comments after adding
        await loadFullPhoto();
        setCommentText('');
      } catch (error) {
        // Silently handle error
        Alert.alert('Error', 'Failed to add comment');
      }
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      if (!userPhone) {
        Alert.alert('Error', 'Please login first');
        return;
      }
      await realApi.likeComment(commentId, userPhone);
      // Reload photo to get updated comment likes
      await loadFullPhoto();
    } catch (error) {
      // Silently handle error
    }
  };

  // Delete photo from detail screen
  const handleDeleteDetail = async () => {
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      if (!userPhone) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      Alert.alert(
        '删除',
        '确定要删除这条照片吗？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              try {
                await realApi.deletePhoto(photo.id, userPhone);
                Alert.alert('成功', '照片已删除');
                navigation.goBack();
              } catch (error) {
                const msg =
                  error?.response?.data?.message ||
                  (error?.response?.status === 403
                    ? '只能删除自己上传的内容'
                    : '删除失败，请稍后重试');
                Alert.alert('错误', msg);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (e) {
      Alert.alert('错误', '删除失败，请稍后重试');
    }
  };

  // 3-dot menu in detail view (download + delete)
  const handleMoreActionsDetail = () => {
    const buttons = [];

    if (photo.imageUrl) {
      buttons.push({
        text: '下载照片',
        onPress: () => downloadImageToGallery(photo.imageUrl, `photo-${photo.id}`),
      });
    }

    buttons.push({
      text: '删除',
      style: 'destructive',
      onPress: handleDeleteDetail,
    });

    buttons.push({
      text: '取消',
      style: 'cancel',
    });

    Alert.alert('更多操作', '', buttons, { cancelable: true });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
      <ScrollView>
        {console.log('[DETAIL] imageUrl', photo.id, photo.imageUrl)}
        {/* Local back button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleMoreActionsDetail} style={{ padding: 4 }}>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.textLight} />
          </TouchableOpacity>
        </View>

        {/* Post Header */}
        <View style={styles.postHeader}>
          <Text style={styles.postAvatar}>{photo.userAvatar}</Text>
          <View style={styles.postUser}>
            <Text style={[styles.postUsername, { color: theme.text }]}>{photo.userName}</Text>
            <Text style={[styles.postTime, { color: theme.textLight }]}>{formatRelativeTime(photo.createdAt)}</Text>
          </View>
        </View>

        {/* Image */}
        <TouchableOpacity
          style={[styles.postImage, { backgroundColor: theme.gradientStart }]}
          onPress={handleDownload}
          activeOpacity={0.9}
        >
          {photo.imageUrl ? (
            <>
              <Image
                source={{ uri: photo.imageUrl }}
                style={styles.postImageImage}
                resizeMode="cover"
              />
              <View style={styles.postImageOverlay}>
                {(photo.tags || []).map((tag, index) => (
                  <View key={index} style={styles.tagBadgeOverlay}>
                    <Text style={[styles.tagBadgeText, { color: theme.primary }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.postImageEmoji}>No Image</Text>
          )}
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity onPress={handleLike}>
            <Ionicons
              name={toBoolean(photo.likedByMe) ? 'heart' : 'heart-outline'}
              size={28}
              color={toBoolean(photo.likedByMe) ? '#e91e63' : theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 15 }}>
            <Ionicons name="chatbubble-outline" size={26} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleSave}>
            <Ionicons
              name={toBoolean(photo.savedByMe) ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color={toBoolean(photo.savedByMe) ? theme.primary : theme.text}
            />
          </TouchableOpacity>
        </View>

        {/* Likes */}
        <Text style={[styles.postLikes, { color: theme.text }]}>{photo.likes} 个赞</Text>

        {/* Caption */}
        <View style={styles.postCaption}>
          <Text style={[styles.postCaptionText, { color: theme.text }]}>
            <Text style={{ fontWeight: 'bold' }}>{photo.userName} </Text>
            {photo.caption}
          </Text>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={[styles.commentsSectionTitle, { color: theme.text }]}>评论</Text>
          {Array.isArray(photo.comments) && photo.comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentAvatar}>👤</Text>
              <View style={styles.commentContent}>
                <Text style={[styles.commentText, { color: theme.text }]}>
                  <Text style={{ fontWeight: 'bold' }}>{comment.userName} </Text>
                  {comment.text}
                </Text>
                <Text style={[styles.commentTime, { color: theme.textLight }]}>
                  {comment.likes} 个赞 · {formatRelativeTime(comment.createdAt)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleLikeComment(comment.id)}>
                <Ionicons
                  name={toBoolean(comment.likedByMe) ? 'heart' : 'heart-outline'}
                  size={16}
                  color={toBoolean(comment.likedByMe) ? '#e91e63' : theme.textLight}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={[styles.commentBox, { borderTopColor: theme.secondary }]}>
        <TextInput
          style={[styles.commentInput, { borderColor: theme.secondary, color: theme.text }]}
          placeholder="添加评论..."
          placeholderTextColor={theme.textLight}
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity
          style={[styles.sendComment, { backgroundColor: theme.primary }]}
          onPress={handleAddComment}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Photo Upload Screen
const PhotoUploadScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedImages, setSelectedImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const data = await realApi.getTags();
      const list = Array.isArray(data) ? data : (data.tags || []);
      setTags(list);
    } catch (error) {
      // Silently handle error
      setTags([]);
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImages(result.assets.slice(0, 9));
      }
    } catch (error) {
      Alert.alert('错误', '无法选择照片，请重试');
    }
  };

  const toggleTag = (tagName) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    if (!tags.find(t => t.name === trimmed)) {
      setTags([...tags, { id: `custom-${trimmed}`, name: trimmed }]);
    }
    setCustomTag('');
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('提示', '请选择至少一张照片');
      return;
    }

    setUploading(true);
    try {
      const userPhone = await AsyncStorage.getItem('user_phone');
      if (!userPhone) {
        Alert.alert('错误', '请先登录');
        setUploading(false);
        return;
      }

      // Create FormData for multipart upload (photos only)
      const formData = new FormData();

      const asset = selectedImages[0];
      const fileUri = asset.uri;
      const fileName = fileUri.split('/').pop() || 'photo.jpg';
      const fileType = asset.mimeType || asset.type || 'image/jpeg';

      // Backend expects field name 'photo' (not 'image')
      formData.append('photo', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      });
      
      // Get user name from RSVP or use default
      let userName = 'Guest';
      try {
        const verifyResult = await realApi.verifyPhone(userPhone);
        if (verifyResult.found && verifyResult.guest && verifyResult.guest.name) {
          userName = verifyResult.guest.name;
        }
      } catch (e) {
        // Use default 'Guest' if can't fetch name
      }
      
      // Backend requires user_name and user_phone
      formData.append('user_name', userName);
      formData.append('user_phone', userPhone);
      
      if (caption && caption.trim()) {
        formData.append('caption', caption.trim());
      }
      
      if (selectedTags.length > 0) {
        // Send tags as JSON string (backend will parse it)
        formData.append('tags', JSON.stringify(selectedTags));
      }

      console.log('[PhotoUpload] Uploading media...', {
        mode: 'photo',
        hasImage: !!selectedImages[0],
        caption: caption || '(empty)',
        tags: selectedTags.length,
        userPhone: userPhone ? '***' : 'missing'
      });

      const response = await realApi.uploadPhoto(formData);
      
      console.log('[PhotoUpload] Upload success:', response);
      
      Alert.alert('成功', '照片已发布！', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('[PhotoUpload] Upload error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || '上传失败，请重试';
      Alert.alert('错误', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        {/* Upload Area */}
        <TouchableOpacity
          style={[styles.uploadArea, { borderColor: theme.secondary }]}
          onPress={pickImages}
        >
          <Ionicons name="cloud-upload-outline" size={60} color={theme.primary} />
          <Text style={[styles.uploadText, { color: theme.textLight }]}>
            {t('upload.pickPhotoHint')}
          </Text>
          <Text style={[styles.uploadHint, { color: theme.textLight }]}>{t('upload.pickHint')}</Text>
        </TouchableOpacity>

        {/* Selected Images */}
        {selectedImages.length > 0 && (
          <View style={styles.selectedImagesContainer}>
            <Text style={[styles.uploadSectionTitle, { color: theme.text }]}>
              {t('upload.selectedPhotos', { count: selectedImages.length })}
            </Text>
            <View style={styles.imageGrid}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imageGridItem}>
                  <Image source={{ uri: image.uri }} style={styles.gridImage} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
        <View style={styles.tagsSection}>
          <Text style={[styles.uploadSectionTitle, { color: theme.text }]}>
            <Ionicons name="pricetags" size={18} color={theme.primary} /> {t('upload.tagsTitle')}
          </Text>
          <View style={styles.tagsGrid}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tagOption,
                  { borderColor: theme.secondary },
                  selectedTags.includes(tag.name) && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => toggleTag(tag.name)}
              >
                <Text
                  style={[
                    styles.tagOptionText,
                    { color: theme.text },
                    selectedTags.includes(tag.name) && { color: '#fff' }
                  ]}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom tag input */}
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <TextInput
              style={[
                styles.captionInput,
                { flex: 1, borderColor: theme.secondary, color: theme.text, height: 40 },
              ]}
              placeholder={t('upload.customTagPlaceholder')}
              placeholderTextColor={theme.textLight}
              value={customTag}
              onChangeText={setCustomTag}
            />
            <TouchableOpacity
              style={[
                styles.uploadButton,
                {
                  marginTop: 0,
                  marginLeft: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={handleAddCustomTag}
            >
              <Text style={styles.uploadButtonText}>添加</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Caption */}
        <View style={styles.captionSection}>
          <Text style={[styles.uploadSectionTitle, { color: theme.text }]}>{t('upload.captionTitle')}</Text>
          <TextInput
            style={[styles.captionInput, { borderColor: theme.secondary, color: theme.text }]}
            placeholder={t('upload.captionPlaceholder')}
            placeholderTextColor={theme.textLight}
            multiline={Boolean(true)}
            numberOfLines={4}
            value={caption}
            onChangeText={setCaption}
          />
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: theme.primary }]}
          onPress={handleUpload}
          disabled={Boolean(uploading === true)}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
          <Text style={styles.uploadButtonText}>{t('upload.button')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Continue in next message due to length...
// I'll create a comprehensive working version

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
const MainTabs = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    console.log('[MainTabs] mounted');
    return () => console.log('[MainTabs] unmounted');
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const isFocused = toBoolean(focused);
          let iconName;
          if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
          else if (route.name === 'Photos') iconName = isFocused ? 'images' : 'images-outline';
          else if (route.name === 'Seats') iconName = isFocused ? 'grid' : 'grid-outline';
          else if (route.name === 'Settings') iconName = isFocused ? 'settings' : 'settings-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textLight,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.secondary },
        headerStyle: { backgroundColor: theme.gradientStart },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: 'bold' },
        lazy: Boolean(false),
        tabBarHideOnKeyboard: Boolean(false)
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tab.home'), headerShown: false }} />
      <Tab.Screen 
        name="Photos" 
        component={PhotoFeedScreen} 
        options={({ navigation }) => ({
          title: t('tab.photos'),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('PhotoUpload')} 
              style={{ marginRight: 15 }}
            >
              <Ionicons name="camera" size={24} color="#000" />
            </TouchableOpacity>
          )
        })} 
      />
      <Tab.Screen name="Seats" component={SeatMapScreen} options={{ title: t('tab.seats') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('tab.settings') }} />
    </Tab.Navigator>
  );
};

// Seat Map Screen - uses seat_table from RSVPs
const SeatMapScreen = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [seatInfo, setSeatInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeat = async () => {
      try {
        const phone = await AsyncStorage.getItem('user_phone');
        if (!phone) {
          setSeatInfo(null);
          setLoading(false);
          return;
        }
        const verifyResult = await realApi.verifyPhone(phone);
        if (!verifyResult.found || !verifyResult.rsvps || verifyResult.rsvps.length === 0) {
          setSeatInfo(null);
        } else {
          // Prefer bride seat if available
          const brideSeat = verifyResult.rsvps.find(r => r.wedding_type === 'bride' && r.seat_table);
          const anySeat = verifyResult.rsvps.find(r => r.seat_table);
          const chosen = brideSeat || anySeat || verifyResult.rsvps[0];
          setSeatInfo(chosen);
        }
      } catch (e) {
        setSeatInfo(null);
      } finally {
        setLoading(false);
      }
    };
    loadSeat();
  }, []);

  const renderSeatText = () => {
    if (!seatInfo || !seatInfo.seat_table) {
      return t('seat.pending');
    }
    return `${t('seat.tablePrefix')} ${seatInfo.seat_table}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.centerContainer}>
        <Text style={[styles.seatMapTitle, { color: theme.text }]}>{t('seat.title')}</Text>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 16 }} />
        ) : (
          <>
            <Text style={[styles.seatMapSubtitle, { color: theme.textLight, marginTop: 16 }]}>
              {renderSeatText()}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

// Collection Screen - saved photos
const CollectionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const phone = await AsyncStorage.getItem('user_phone');
        if (!phone) {
          setItems([]);
          setLoading(false);
          return;
        }
        const data = await realApi.getMyCollections(phone);
        const photos = Array.isArray(data)
          ? data
          : Array.isArray(data.photos)
          ? data.photos
          : [];
        const baseUrl = realApi?.apiBaseUrl || '';
        const normalized = photos.map(photo => {
          const imageUrl =
            photo.image_url && photo.image_url.startsWith('/')
              ? `${baseUrl}${photo.image_url}`
              : photo.image_url;
          return {
            id: photo.id,
            type: 'photo',
            userName: photo.user_name || 'Guest',
            userAvatar: (photo.user_name && photo.user_name[0]) || '👤',
            createdAt: photo.created_at,
            imageUrl,
            caption: photo.caption || '',
            tags: [],
            likes: 0,
            totalComments: 0,
            likedByMe: false,
            savedByMe: true,
          };
        });
        setItems(normalized);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with back button */}
      <View style={[styles.themeHeader, { backgroundColor: theme.gradientStart }]}>
        <TouchableOpacity
          style={{ position: 'absolute', left: 20, top: 10, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.themeTitle, { color: theme.text }]}>{t('settings.collection')}</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.textLight }}>{t('settings.collection.desc')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={({ item }) => (
            <View style={styles.photoPost}>
              <View style={styles.postHeader}>
                <Text style={styles.postAvatar}>{item.userAvatar}</Text>
                <View style={styles.postUser}>
                  <Text style={[styles.postUsername, { color: theme.text }]}>{item.userName}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.postImage, { backgroundColor: theme.gradientStart }]}
                onPress={() => navigation.navigate('PhotoDetail', { photo: item })}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.postImageImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.postImageEmoji}>No Image</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={item => `collection-${item.id}`}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// Timeline Screen
const TimelineScreen = () => {
  const { theme } = useTheme();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await realApi.getTimeline();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        // Silently use empty array
        setEvents([]);
      }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={[styles.timelineHeader, { backgroundColor: theme.gradientStart }]}>
          <Text style={[styles.timelineHeaderTitle, { color: theme.text }]}>2026年1月4日</Text>
          <Text style={[styles.timelineHeaderSubtitle, { color: theme.textLight }]}>婚礼时间安排</Text>
        </View>
        <View style={styles.timeline}>
          {events.map((event, index) => (
            <View key={event.id} style={styles.timelineItem}>
              <View style={[styles.timelineIcon, { backgroundColor: theme.primary }]}>
                <Text style={styles.timelineIconText}>{event.icon}</Text>
              </View>
              <View style={[styles.timelineContent, { backgroundColor: '#fff' }]}>
                <Text style={[styles.timelineTime, { color: theme.primary }]}>{event.time}</Text>
                <Text style={[styles.timelineTitle, { color: theme.text }]}>{event.title}</Text>
                <Text style={[styles.timelineDesc, { color: theme.textLight }]}>{event.description}</Text>
              </View>
              {index < events.length - 1 && (
                <View style={[styles.timelineLine, { backgroundColor: theme.secondary }]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Settings Screen
const SettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { language, setLanguage, languages, t } = useLanguage();
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    const loadUserPhone = async () => {
      try {
        const phone = await AsyncStorage.getItem('user_phone');
        if (phone) setUserPhone(phone);
      } catch (e) {
        // Ignore
      }
    };
    loadUserPhone();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      t('settings.logout.title'),
      t('settings.logout.message'),
      [
        {
          text: t('settings.logout.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear user data
              await AsyncStorage.multiRemove(['user_phone', 'user_role']);
              // Navigate to login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert(t('settings.logout.error'));
            }
          },
        },
      ]
    );
  };

  const currentLangLabel = languages[language]?.nativeLabel || 'English';

  const settings = [
    {
      icon: 'color-palette',
      title: t('settings.theme'),
      desc: t(`theme.${theme.id}.title`),
      screen: 'ThemeSelection',
    },
    {
      icon: 'bookmark',
      title: t('settings.collection'),
      desc: t('settings.collection.desc'),
      screen: 'Collection',
    },
    {
      icon: 'information-circle',
      title: t('settings.about'),
      desc: t('settings.about.desc'),
      screen: null,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.settingsList}>
        {/* Current User Info */}
        {userPhone && (
          <View style={[styles.userInfoCard, { backgroundColor: '#fff' }]}>
            <View style={styles.userInfoContent}>
              <Ionicons name="person-circle" size={40} color={theme.primary} />
              <View style={styles.userInfoText}>
                <Text style={[styles.userInfoLabel, { color: theme.textLight }]}>{t('settings.currentUser')}</Text>
                <Text style={[styles.userInfoPhone, { color: theme.text }]}>{userPhone}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Language Selector (2x2 grid) */}
        <View style={[styles.settingsItem, { backgroundColor: '#fff' }]}>
          <View style={styles.settingsLeft}>
            <View style={[styles.settingsIcon, { backgroundColor: theme.secondary }]}>
              <Ionicons name="language" size={24} color={theme.primary} />
            </View>
            <View style={styles.settingsText}>
              <Text style={[styles.settingsTitle, { color: theme.text }]}>
                {t('settings.language')} / Language
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  marginTop: 8,
                }}
              >
                {Object.values(languages).map((lang) => (
                  <TouchableOpacity
                    key={lang.id}
                    onPress={() => setLanguage(lang.id)}
                    style={{
                      width: '48%',
                      marginBottom: 8,
                      marginRight: '2%',
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor:
                        language === lang.id ? theme.primary : theme.secondary,
                      backgroundColor:
                        language === lang.id ? theme.primary : 'transparent',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: language === lang.id ? '#fff' : theme.text,
                      }}
                    >
                      {lang.nativeLabel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Other settings */}
        {settings.map((setting, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.settingsItem, { backgroundColor: '#fff' }]}
            onPress={() => {
              if (setting.screen) {
                navigation.navigate(setting.screen);
              }
            }}
          >
            <View style={styles.settingsLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: theme.secondary }]}>
                <Ionicons name={setting.icon} size={24} color={theme.primary} />
              </View>
              <View style={styles.settingsText}>
                <Text style={[styles.settingsTitle, { color: theme.text }]}>{setting.title}</Text>
                <Text style={[styles.settingsDesc, { color: theme.textLight }]}>{setting.desc}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: theme.secondary }]}
          onPress={handleLogout}
        >
          <View style={styles.settingsLeft}>
            <View style={[styles.settingsIcon, { backgroundColor: '#ff4444' }]}>
              <Ionicons name="log-out" size={24} color="#fff" />
            </View>
            <View style={styles.settingsText}>
              <Text style={[styles.logoutText, { color: '#ff4444' }]}>{t('settings.logout')}</Text>
              <Text style={[styles.settingsDesc, { color: theme.textLight }]}>{t('settings.logout.desc')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Theme Selection Screen
const ThemeSelectionScreen = ({ navigation }) => {
  const { theme, changeTheme } = useTheme();
  const { t } = useLanguage();
  const allThemes = Object.values(themes);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.themeSelection}>
        <View style={styles.themeHeader}>
          <TouchableOpacity
            style={{ position: 'absolute', left: 20, top: 10, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.themeTitle, { color: theme.text }]}>{t('theme.title')}</Text>
          <Text style={[styles.themeSubtitle, { color: theme.textLight }]}>{t('theme.subtitle')}</Text>
        </View>
        <View style={styles.themesGrid}>
          {allThemes.map(themeItem => (
            <TouchableOpacity
              key={themeItem.id}
              style={[
                styles.themeCard,
                { borderColor: theme.secondary },
                theme.id === themeItem.id && { borderColor: theme.primary, borderWidth: 3 }
              ]}
              onPress={() => changeTheme(themeItem.id)}
            >
              <View style={[styles.themePreview, { backgroundColor: themeItem.gradientStart }]}>
                <Text style={styles.themePreviewIcon}>{themeItem.icon}</Text>
              </View>
              <Text style={[styles.themeName, { color: theme.text }]}>{t(`theme.${themeItem.id}.title`)}</Text>
              <Text style={[styles.themeDescription, { color: theme.textLight }]}>{t(`theme.${themeItem.id}.desc`)}</Text>
              <View style={styles.themeColors}>
                <View style={[styles.themeColorDot, { backgroundColor: themeItem.primary }]} />
                <View style={[styles.themeColorDot, { backgroundColor: themeItem.secondary }]} />
                <View style={[styles.themeColorDot, { backgroundColor: themeItem.accent }]} />
              </View>
              {theme.id === themeItem.id && (
                <View style={[styles.themeCheckmark, { backgroundColor: theme.primary }]}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Simple root content component used for step-by-step debugging
const PlainRootScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000000' }}>Plain Root Screen</Text>
    <Text style={{ marginTop: 8, color: '#555555', textAlign: 'center', paddingHorizontal: 24 }}>
      If you can see this, the crash is not in basic React Native views.
    </Text>
  </View>
);

// Main App – ThemeProvider + Stack with Splash → Main (real app)
export default function App() {
  useEffect(() => {
    console.log('[App] root mounted (Splash -> Login/Main stack)');
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="GroomProfile"
              component={GroomProfileScreen}
            />
            <Stack.Screen
              name="BrideProfile"
              component={BrideProfileScreen}
            />
            <Stack.Screen
              name="PhotoDetail"
              component={PhotoDetailScreen}
            />
            <Stack.Screen
              name="PhotoUpload"
              component={PhotoUploadScreen}
            />
            <Stack.Screen
              name="Timeline"
              component={TimelineScreen}
            />
            <Stack.Screen
              name="Collection"
              component={CollectionScreen}
            />
            <Stack.Screen
              name="ThemeSelection"
              component={ThemeSelectionScreen}
            />
            <Stack.Screen
              name="ApiTest"
              component={ApiTestScreen}
            />
            <Stack.Screen
              name="RSVP"
              component={RSVPScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </LanguageProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Splash Screen
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  splashLogo: {
    fontSize: 80,
    marginBottom: 20
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10
  },
  splashSubtitle: {
    fontSize: 18,
    marginBottom: 40
  },
  splashHearts: {
    fontSize: 32,
    marginVertical: 20
  },
  splashDate: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 60
  },
  // Home Screen
  heroSection: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10
  },
  heroDate: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5
  },
  heroLocation: {
    fontSize: 16
  },
  countdownBox: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  countdownTitle: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center'
  },
  countdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  countdownItem: {
    alignItems: 'center'
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5
  },
  countdownLabel: {
    fontSize: 14
  },
  rsvpSection: {
    padding: 20,
    paddingTop: 10,
  },
  homeSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  rsvpButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  rsvpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20
  },
  featureCard: {
    width: '47%',
    margin: '1.5%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 10
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  featureDesc: {
    fontSize: 14,
    textAlign: 'center'
  },
  // Person Profile
  personHeader: {
    padding: 30,
    alignItems: 'center'
  },
  personAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  personAvatarText: {
    fontSize: 60
  },
  personName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10
  },
  personRole: {
    fontSize: 16
  },
  personInfo: {
    padding: 20
  },
  infoSection: {
    marginBottom: 25
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 5
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '500'
  },
  infoDivider: {
    height: 1,
    marginVertical: 15
  },
  // Photo Feed
  photoPost: {
    backgroundColor: '#fff',
    marginBottom: 10
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5D7DA',
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 18
  },
  postUser: {
    flex: 1
  },
  postUsername: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  postTime: {
    fontSize: 12
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E5D4C8',
    borderRadius: 20,
  },
  postImageEmoji: {
    fontSize: 60
  },
  postImageImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 18,
    backgroundColor: '#000'
  },
  postImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tagBadgeOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  tagBadgeText: {
    fontSize: 13,
    fontWeight: '600'
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 15
  },
  postLikes: {
    paddingHorizontal: 15,
    paddingBottom: 8,
    fontSize: 15,
    fontWeight: 'bold'
  },
  postCaption: {
    paddingHorizontal: 15,
    paddingBottom: 8
  },
  postCaptionText: {
    fontSize: 14,
    lineHeight: 20
  },
  postComments: {
    paddingHorizontal: 15,
    paddingBottom: 12
  },
  viewComments: {
    fontSize: 14
  },
  // Comments
  commentsSection: {
    padding: 15
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5D7DA',
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 16
  },
  commentContent: {
    flex: 1
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4
  },
  commentTime: {
    fontSize: 12
  },
  commentBox: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    gap: 10
  },
  commentInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    fontSize: 14
  },
  sendComment: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Photo Upload
  uploadArea: {
    margin: 20,
    padding: 40,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  uploadText: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 10
  },
  uploadHint: {
    fontSize: 14
  },
  selectedImagesContainer: {
    padding: 20
  },
  uploadSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  imageGridItem: {
    width: (width - 60) / 3,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden'
  },
  gridImage: {
    width: '100%',
    height: '100%'
  },
  tagsSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  tagOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 20
  },
  tagOptionText: {
    fontSize: 14,
    paddingHorizontal: 2
  },
  captionSection: {
    padding: 20
  },
  captionInput: {
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    lineHeight: 20
  },
  uploadButton: {
    margin: 20,
    padding: 15,
    borderRadius: 50,
    alignItems: 'center'
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  // Seat Map
  seatMapContainer: {
    padding: 20
  },
  seatMapHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  seatMapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  seatMapSubtitle: {
    fontSize: 14
  },
  tableSection: {
    marginBottom: 30
  },
  tableLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20
  },
  seatItem: {
    width: (width - 70) / 4,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  seatNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3
  },
  seatName: {
    fontSize: 11,
    textAlign: 'center'
  },
  seatLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2
  },
  legendOccupied: {},
  legendMySeat: {},
  legendText: {
    fontSize: 14
  },
  videoInfo: {
    padding: 15
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  videoDuration: {
    fontSize: 14
  },
  // Timeline
  timelineHeader: {
    padding: 30,
    alignItems: 'center'
  },
  timelineHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  timelineHeaderSubtitle: {
    fontSize: 14
  },
  timeline: {
    padding: 20
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 25,
    position: 'relative'
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  timelineIconText: {
    fontSize: 16
  },
  timelineContent: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3
  },
  timelineDesc: {
    fontSize: 14
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 40,
    bottom: -25,
    width: 2
  },
  // Settings
  settingsList: {
    padding: 20
  },
  userInfoCard: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  userInfoText: {
    flex: 1
  },
  userInfoLabel: {
    fontSize: 12,
    marginBottom: 4
  },
  userInfoPhone: {
    fontSize: 16,
    fontWeight: '600'
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600'
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingsText: {
    flex: 1
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3
  },
  settingsDesc: {
    fontSize: 14
  },
  // Theme Selection
  themeSelection: {
    padding: 20
  },
  themeHeader: {
    alignItems: 'center',
    marginBottom: 30
  },
  themeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  themeSubtitle: {
    fontSize: 14
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20
  },
  themeCard: {
    width: (width - 55) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    position: 'relative'
  },
  themePreview: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  themePreviewIcon: {
    fontSize: 32
  },
  themeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  themeDescription: {
    fontSize: 12,
    marginBottom: 10
  },
  themeColors: {
    flexDirection: 'row',
    gap: 8
  },
  themeColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  themeCheckmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
