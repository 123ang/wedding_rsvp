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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockData } from './src/data/mockData';
import { themes, defaultTheme } from './src/utils/themes';
import * as mockApi from './src/services/mockApi';
import { toBoolean } from './src/utils/booleanUtils';
import ApiTestScreen from './src/screens/ApiTestScreen';
import RSVPScreen from './src/screens/RSVPScreen';
import LoginScreen from './src/screens/LoginScreen';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';

const { width } = Dimensions.get('window');

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
      const themeId = await mockApi.getTheme();
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
      await mockApi.setTheme(themeId);
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

  useEffect(() => {
    console.log('[Splash] mounted (decide Login/Main)');

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

    const timer = setTimeout(decideNext, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={[styles.splashContainer, { backgroundColor: theme.gradientStart }]}>
      <Text style={styles.splashLogo}>💒</Text>
      <Text style={[styles.splashTitle, { color: theme.text }]}>
        {mockData.weddingInfo.groomShortName} ♥ {mockData.weddingInfo.brideShortName}
      </Text>
      <Text style={[styles.splashSubtitle, { color: theme.textLight }]}>Wedding Celebration</Text>
      <Text style={styles.splashHearts}>💕 💕 💕</Text>
      <Text style={[styles.splashDate, { color: theme.primary }]}>{mockData.weddingInfo.date}</Text>
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
  const [countdown, setCountdown] = useState({ days: 365, hours: 12, minutes: 30, seconds: 45 });

  useEffect(() => {
    console.log('[Home] mounted');
    return () => console.log('[Home] unmounted');
  }, []);

  const features = [
    { icon: '👔', title: '认识新郎', desc: '了解他的故事', screen: 'GroomProfile' },
    { icon: '👰', title: '认识新娘', desc: '了解她的故事', screen: 'BrideProfile' },
    { icon: '🪑', title: '座位地图', desc: '查看您的座位', screen: 'SeatMap' },
    { icon: '📸', title: '照片画廊', desc: '美好回忆', screen: 'PhotoFeed' },
    { icon: '📹', title: '视频', desc: '精彩瞬间', screen: 'Videos' },
    { icon: '📅', title: '婚礼流程', desc: '时间安排', screen: 'Timeline' }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" hidden={Boolean(false)} translucent={Boolean(false)} />
      <ScrollView showsVerticalScrollIndicator={Boolean(false)}>
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: theme.gradientStart }]}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            {mockData.weddingInfo.groomShortName} ♥ {mockData.weddingInfo.brideShortName}
          </Text>
          <Text style={[styles.heroDate, { color: theme.primary }]}>{mockData.weddingInfo.date}</Text>
          <Text style={[styles.heroLocation, { color: theme.textLight }]}>
            📍 {mockData.weddingInfo.venue}
          </Text>
        </View>

        {/* Countdown */}
        <View style={[styles.countdownBox, { backgroundColor: '#fff' }]}>
          <Text style={[styles.countdownTitle, { color: theme.textLight }]}>距离婚礼还有</Text>
          <View style={styles.countdownGrid}>
            {[
              { value: countdown.days, label: '天' },
              { value: countdown.hours, label: '小时' },
              { value: countdown.minutes, label: '分钟' },
              { value: countdown.seconds, label: '秒' }
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>确认出席</Text>
          <TouchableOpacity
            style={[styles.rsvpButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('RSVP', { type: 'bride' })}
          >
            <Text style={styles.rsvpButtonText}>👰 新娘婚礼 RSVP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rsvpButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate('RSVP', { type: 'groom' })}
          >
            <Text style={styles.rsvpButtonText}>👔 新郎婚礼 RSVP</Text>
          </TouchableOpacity>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.featureCard, { backgroundColor: '#fff' }]}
              onPress={() => navigation.navigate(feature.screen)}
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
  const profile = mockData.groomProfile;

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
  const profile = mockData.brideProfile;

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
      const data = await mockApi.getPhotos();
      // Double-check all booleans are normalized
      const normalized = data.map(photo => {
        const p = { ...photo };
        p.likedByMe = toBoolean(p.likedByMe);
        p.savedByMe = toBoolean(p.savedByMe);
        if (p.comments) {
          p.comments = p.comments.map(c => ({
            ...c,
            likedByMe: toBoolean(c.likedByMe)
          }));
        }
        return p;
      });
      setPhotos(normalized);
      setLoading(false);
    } catch (error) {
      console.error('Error loading photos:', error);
      setLoading(false);
    }
  };

  const handleLike = async (photoId) => {
    const updated = await mockApi.likePhoto(photoId);
    const normalized = {
      ...updated,
      likedByMe: toBoolean(updated.likedByMe),
      savedByMe: toBoolean(updated.savedByMe),
      comments: updated.comments ? updated.comments.map(c => ({
        ...c,
        likedByMe: toBoolean(c.likedByMe)
      })) : []
    };
    setPhotos(photos.map(p => p.id === photoId ? normalized : p));
  };

  const handleSave = async (photoId) => {
    const updated = await mockApi.savePhoto(photoId);
    const normalized = {
      ...updated,
      likedByMe: toBoolean(updated.likedByMe),
      savedByMe: toBoolean(updated.savedByMe),
      comments: updated.comments ? updated.comments.map(c => ({
        ...c,
        likedByMe: toBoolean(c.likedByMe)
      })) : []
    };
    setPhotos(photos.map(p => p.id === photoId ? normalized : p));
  };

  const renderPhoto = ({ item }) => (
    <View style={styles.photoPost}>
      {/* Header */}
      <View style={styles.postHeader}>
        <Text style={styles.postAvatar}>{item.userAvatar}</Text>
        <View style={styles.postUser}>
          <Text style={[styles.postUsername, { color: theme.text }]}>{item.userName}</Text>
          <Text style={[styles.postTime, { color: theme.textLight }]}>2小时前</Text>
        </View>
      </View>

      {/* Image */}
      <TouchableOpacity
        style={[styles.postImage, { backgroundColor: theme.gradientStart }]}
        onPress={() => navigation.navigate('PhotoDetail', { photo: item })}
      >
        <Text style={styles.postImageEmoji}>{item.imageUrl}</Text>
        <View style={styles.postImageOverlay}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tagBadgeOverlay}>
              <Text style={[styles.tagBadgeText, { color: theme.primary }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      {/* Actions */}
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

      {/* Likes */}
      <Text style={[styles.postLikes, { color: theme.text }]}>{item.likes} 个赞</Text>

      {/* Caption */}
      <View style={styles.postCaption}>
        <Text style={[styles.postCaptionText, { color: theme.text }]}>
          <Text style={{ fontWeight: 'bold' }}>{item.userName} </Text>
          {item.caption}
        </Text>
      </View>

      {/* Comments */}
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
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={Boolean(false)}
        removeClippedSubviews={Boolean(false)}
      />
    </SafeAreaView>
  );
};

// Photo Detail Screen (with comments)
const PhotoDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const [photo, setPhoto] = useState(() => {
    const p = route.params.photo;
    return {
      ...p,
      likedByMe: toBoolean(p.likedByMe),
      savedByMe: toBoolean(p.savedByMe),
      comments: p.comments ? p.comments.map(c => ({
        ...c,
        likedByMe: toBoolean(c.likedByMe)
      })) : []
    };
  });
  const [commentText, setCommentText] = useState('');

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
    const updated = await mockApi.likePhoto(photo.id);
    setPhoto(normalizePhoto(updated));
  };

  const handleSave = async () => {
    const updated = await mockApi.savePhoto(photo.id);
    setPhoto(normalizePhoto(updated));
  };

  const handleAddComment = async () => {
    if (commentText.trim()) {
      const updated = await mockApi.addComment(photo.id, commentText);
      setPhoto(normalizePhoto(updated));
      setCommentText('');
    }
  };

  const handleLikeComment = async (commentId) => {
    const updated = await mockApi.likeComment(photo.id, commentId);
    setPhoto(normalizePhoto(updated));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]}>
      <ScrollView>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Text style={styles.postAvatar}>{photo.userAvatar}</Text>
          <View style={styles.postUser}>
            <Text style={[styles.postUsername, { color: theme.text }]}>{photo.userName}</Text>
            <Text style={[styles.postTime, { color: theme.textLight }]}>2小时前</Text>
          </View>
        </View>

        {/* Image */}
        <View style={[styles.postImage, { backgroundColor: theme.gradientStart }]}>
          <Text style={styles.postImageEmoji}>{photo.imageUrl}</Text>
          <View style={styles.postImageOverlay}>
            {photo.tags.map((tag, index) => (
              <View key={index} style={styles.tagBadgeOverlay}>
                <Text style={[styles.tagBadgeText, { color: theme.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

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
          {photo.comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentAvatar}>👤</Text>
              <View style={styles.commentContent}>
                <Text style={[styles.commentText, { color: theme.text }]}>
                  <Text style={{ fontWeight: 'bold' }}>{comment.userName} </Text>
                  {comment.text}
                </Text>
                <Text style={[styles.commentTime, { color: theme.textLight }]}>
                  {comment.likes} 个赞 · 刚刚
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
    </SafeAreaView>
  );
};

// Photo Upload Screen
const PhotoUploadScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [selectedImages, setSelectedImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tags, setTags] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    const data = await mockApi.getTags();
    setTags(data);
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8
    });

    if (!result.canceled) {
      setSelectedImages(result.assets.slice(0, 9));
    }
  };

  const toggleTag = (tagName) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('提示', '请选择至少一张照片');
      return;
    }

    setUploading(true);
    try {
      await mockApi.uploadPhoto(selectedImages[0].uri, caption, selectedTags);
      Alert.alert('成功', '照片已发布！', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('错误', '上传失败，请重试');
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
          <Text style={[styles.uploadText, { color: theme.textLight }]}>点击选择照片</Text>
          <Text style={[styles.uploadHint, { color: theme.textLight }]}>支持多选，最多9张</Text>
        </TouchableOpacity>

        {/* Selected Images */}
        {selectedImages.length > 0 && (
          <View style={styles.selectedImagesContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              已选择照片 ({selectedImages.length})
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            <Ionicons name="pricetags" size={18} color={theme.primary} /> 选择标签（可选）
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
        </View>

        {/* Caption */}
        <View style={styles.captionSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>添加描述（可选）</Text>
          <TextInput
            style={[styles.captionInput, { borderColor: theme.secondary, color: theme.text }]}
            placeholder="分享这一刻的感受..."
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
            <Text style={styles.uploadButtonText}>发布照片</Text>
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页', headerTitle: `${mockData.weddingInfo.groomShortName} ♥ ${mockData.weddingInfo.brideShortName} Wedding` }} />
      <Tab.Screen 
        name="Photos" 
        component={PhotoFeedScreen} 
        options={({ navigation }) => ({
          title: '照片',
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
      <Tab.Screen name="Seats" component={SeatMapScreen} options={{ title: '座位' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: '设置' }} />
    </Tab.Navigator>
  );
};

// Seat Map Screen
const SeatMapScreen = () => {
  const { theme } = useTheme();
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    loadSeats();
  }, []);

  const loadSeats = async () => {
    try {
      const data = await mockApi.getSeats();
      // Double-check all booleans are normalized
      const normalized = data.map(seat => ({
        ...seat,
        occupied: toBoolean(seat.occupied),
        isMySeat: toBoolean(seat.isMySeat)
      }));
      setSeats(normalized);
    } catch (error) {
      console.error('Error loading seats:', error);
    }
  };

  const tables = [1, 2, 3];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.seatMapContainer}>
        <View style={styles.seatMapHeader}>
          <Text style={[styles.seatMapTitle, { color: theme.text }]}>座位地图</Text>
          <Text style={[styles.seatMapSubtitle, { color: theme.textLight }]}>Table 3 - Seat 13</Text>
        </View>

        {tables.map(tableNum => (
          <View key={tableNum} style={styles.tableSection}>
            <Text style={[styles.tableLabel, { color: theme.primary }]}>Table {tableNum}</Text>
            <View style={styles.tableGrid}>
              {seats
                .filter(seat => seat.tableNumber === tableNum)
                .map(seat => (
                  <View
                    key={seat.id}
                    style={[
                      styles.seatItem,
                      { borderColor: theme.secondary },
                      toBoolean(seat.occupied) && { backgroundColor: theme.secondary, borderColor: theme.primary },
                      toBoolean(seat.isMySeat) && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                  >
                    <Text
                      style={[
                        styles.seatNumber,
                        { color: theme.textLight },
                        toBoolean(seat.isMySeat) && { color: '#fff' }
                      ]}
                    >
                      {seat.seatNumber}
                    </Text>
                    {(seat.guestName && seat.guestName !== '') && (
                      <Text
                        style={[
                          styles.seatName,
                          { color: theme.text },
                          toBoolean(seat.isMySeat) && { color: '#fff' }
                        ]}
                      >
                        {seat.guestName}
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          </View>
        ))}

        {/* Legend */}
        <View style={styles.seatLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { borderColor: theme.secondary }]} />
            <Text style={[styles.legendText, { color: theme.text }]}>空座位</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendOccupied, { backgroundColor: theme.secondary, borderColor: theme.primary }]} />
            <Text style={[styles.legendText, { color: theme.text }]}>已分配</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendMySeat, { backgroundColor: theme.primary, borderColor: theme.primary }]} />
            <Text style={[styles.legendText, { color: theme.text }]}>我的座位</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Videos Screen
const VideosScreen = () => {
  const { theme } = useTheme();
  const videos = mockData.videos;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={[styles.videosHeader, { backgroundColor: theme.gradientStart }]}>
          <Text style={[styles.videosTitle, { color: theme.text }]}>精彩视频</Text>
          <Text style={[styles.videosSubtitle, { color: theme.textLight }]}>记录美好时刻</Text>
        </View>
        <View style={styles.videoList}>
          {videos.map(video => (
            <View key={video.id} style={styles.videoItem}>
              <View style={[styles.videoThumbnail, { backgroundColor: theme.gradientStart }]}>
                <Text style={styles.videoThumbnailEmoji}>{video.thumbnailUrl}</Text>
                <View style={[styles.playButton, { backgroundColor: theme.primary }]}>
                  <Ionicons name="play" size={24} color="#fff" />
                </View>
              </View>
              <View style={styles.videoInfo}>
                <Text style={[styles.videoTitle, { color: theme.text }]}>{video.title}</Text>
                <Text style={[styles.videoDuration, { color: theme.textLight }]}>
                  <Ionicons name="time-outline" size={14} /> {video.duration}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Timeline Screen
const TimelineScreen = () => {
  const { theme } = useTheme();
  const events = mockData.timeline;

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
  const { language, setLanguage, languages } = useLanguage();

  const cycleLanguage = () => {
    const order = ['en', 'ms', 'ja'];
    const currentIndex = order.indexOf(language);
    const next = order[(currentIndex + 1) % order.length];
    setLanguage(next);
  };

  const currentLangLabel = languages[language]?.nativeLabel || 'English';

  const settings = [
    { icon: 'flask', title: 'API 测试', desc: '测试服务器连接', screen: 'ApiTest' },
    { icon: 'notifications', title: '通知设置', desc: '管理推送通知', screen: null },
    { icon: 'color-palette', title: '主题颜色', desc: theme.name, screen: 'ThemeSelection' },
    { icon: 'language', title: '语言', desc: currentLangLabel, screen: null },
    { icon: 'share-social', title: '分享应用', desc: '邀请朋友使用', screen: null },
    { icon: 'information-circle', title: '关于', desc: '版本 1.0.0', screen: null },
    { icon: 'help-circle', title: '帮助与支持', desc: '常见问题', screen: null }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.settingsList}>
        {settings.map((setting, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.settingsItem, { backgroundColor: '#fff' }]}
            onPress={() => {
              if (setting.icon === 'language') {
                cycleLanguage();
              } else if (setting.screen) {
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
      </ScrollView>
    </SafeAreaView>
  );
};

// Theme Selection Screen
const ThemeSelectionScreen = () => {
  const { theme, changeTheme } = useTheme();
  const allThemes = Object.values(themes);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.themeSelection}>
        <View style={styles.themeHeader}>
          <Text style={[styles.themeTitle, { color: theme.text }]}>选择主题</Text>
          <Text style={[styles.themeSubtitle, { color: theme.textLight }]}>选择您喜欢的颜色主题</Text>
        </View>
        <View style={styles.themesGrid}>
          {allThemes.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.themeCard,
                { borderColor: theme.secondary },
                theme.id === t.id && { borderColor: theme.primary, borderWidth: 3 }
              ]}
              onPress={() => changeTheme(t.id)}
            >
              <View style={[styles.themePreview, { backgroundColor: t.gradientStart }]}>
                <Text style={styles.themePreviewIcon}>{t.icon}</Text>
              </View>
              <Text style={[styles.themeName, { color: theme.text }]}>{t.name}</Text>
              <Text style={[styles.themeDescription, { color: theme.textLight }]}>{t.description}</Text>
              <View style={styles.themeColors}>
                <View style={[styles.themeColorDot, { backgroundColor: t.primary }]} />
                <View style={[styles.themeColorDot, { backgroundColor: t.secondary }]} />
                <View style={[styles.themeColorDot, { backgroundColor: t.accent }]} />
              </View>
              {theme.id === t.id && (
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
              name="Videos"
              component={VideosScreen}
            />
            <Stack.Screen
              name="Timeline"
              component={TimelineScreen}
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
    padding: 30,
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
    margin: 20,
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
  sectionTitle: {
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
    padding: 10
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
    position: 'relative'
  },
  postImageEmoji: {
    fontSize: 60
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
  sectionTitle: {
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
    fontSize: 14
  },
  captionSection: {
    padding: 20
  },
  captionInput: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top'
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
  // Videos
  videosHeader: {
    padding: 30,
    alignItems: 'center'
  },
  videosTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  videosSubtitle: {
    fontSize: 14
  },
  videoList: {
    padding: 20
  },
  videoItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  videoThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  videoThumbnailEmoji: {
    fontSize: 60
  },
  playButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9
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
