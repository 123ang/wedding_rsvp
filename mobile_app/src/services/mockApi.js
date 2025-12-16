import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockData } from '../data/mockData';
import { normalizePhoto, normalizeSeat, normalizeComment } from '../utils/booleanUtils';

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Storage keys
const STORAGE_KEYS = {
  PHOTOS: '@wedding_photos',
  TAGS: '@wedding_tags',
  SEATS: '@wedding_seats',
  GUESTS: '@wedding_guests',
  THEME: '@wedding_theme',
  USER_PHONE: '@user_phone'
};

// Clear all cached data and reset to fresh mock data
export const resetAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PHOTOS,
      STORAGE_KEYS.TAGS,
      STORAGE_KEYS.SEATS,
      STORAGE_KEYS.GUESTS,
    ]);
    console.log('All cached data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Initialize data in AsyncStorage
export const initializeData = async () => {
  try {
    // Always clear old data to prevent boolean string corruption
    await resetAllData();
    
    // Set fresh data with proper booleans
    await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(mockData.photos));
    await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(mockData.tags));
    await AsyncStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(mockData.seats));
    await AsyncStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(mockData.guests));
    
    console.log('Data initialized with proper boolean types');
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

// Photo API
export const getPhotos = async () => {
  await delay();
  try {
    const photos = await AsyncStorage.getItem(STORAGE_KEYS.PHOTOS);
    const parsedPhotos = photos ? JSON.parse(photos) : mockData.photos;
    // Normalize all boolean values
    return parsedPhotos.map(photo => {
      const normalized = normalizePhoto(photo);
      if (normalized.comments) {
        normalized.comments = normalized.comments.map(normalizeComment);
      }
      return normalized;
    });
  } catch (error) {
    // Also normalize mockData.photos
    return mockData.photos.map(photo => {
      const normalized = normalizePhoto(photo);
      if (normalized.comments) {
        normalized.comments = normalized.comments.map(normalizeComment);
      }
      return normalized;
    });
  }
};

export const likePhoto = async (photoId) => {
  await delay(200);
  try {
    const photos = await getPhotos();
    const updatedPhotos = photos.map(photo => {
      if (photo.id === photoId) {
        return {
          ...photo,
          likedByMe: !photo.likedByMe,
          likes: photo.likedByMe ? photo.likes - 1 : photo.likes + 1
        };
      }
      return photo;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updatedPhotos));
    return updatedPhotos.find(p => p.id === photoId);
  } catch (error) {
    throw error;
  }
};

export const savePhoto = async (photoId) => {
  await delay(200);
  try {
    const photos = await getPhotos();
    const updatedPhotos = photos.map(photo => {
      if (photo.id === photoId) {
        return {
          ...photo,
          savedByMe: !photo.savedByMe
        };
      }
      return photo;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updatedPhotos));
    return updatedPhotos.find(p => p.id === photoId);
  } catch (error) {
    throw error;
  }
};

export const addComment = async (photoId, text, userName = "您") => {
  await delay(300);
  try {
    const photos = await getPhotos();
    const updatedPhotos = photos.map(photo => {
      if (photo.id === photoId) {
        const newComment = {
          id: photo.comments.length + 1,
          userId: "currentUser",
          userName: userName,
          text: text,
          likes: 0,
          likedByMe: false,
          createdAt: new Date().toISOString()
        };
        return {
          ...photo,
          comments: [...photo.comments, newComment],
          totalComments: photo.totalComments + 1
        };
      }
      return photo;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updatedPhotos));
    return updatedPhotos.find(p => p.id === photoId);
  } catch (error) {
    throw error;
  }
};

export const likeComment = async (photoId, commentId) => {
  await delay(200);
  try {
    const photos = await getPhotos();
    const updatedPhotos = photos.map(photo => {
      if (photo.id === photoId) {
        const updatedComments = photo.comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likedByMe: !comment.likedByMe,
              likes: comment.likedByMe ? comment.likes - 1 : comment.likes + 1
            };
          }
          return comment;
        });
        return {
          ...photo,
          comments: updatedComments
        };
      }
      return photo;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updatedPhotos));
    return updatedPhotos.find(p => p.id === photoId);
  } catch (error) {
    throw error;
  }
};

export const uploadPhoto = async (imageUri, caption, selectedTags) => {
  await delay(1000);
  try {
    const photos = await getPhotos();
    const newPhoto = {
      id: photos.length + 1,
      userId: "currentUser",
      userName: "您",
      userPhone: "+60164226901",
      userAvatar: "👤",
      imageUrl: imageUri || "📸",
      caption: caption,
      tags: selectedTags,
      likes: 0,
      likedByMe: false,
      savedByMe: false,
      comments: [],
      totalComments: 0,
      createdAt: new Date().toISOString()
    };
    const updatedPhotos = [newPhoto, ...photos];
    await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updatedPhotos));
    return newPhoto;
  } catch (error) {
    throw error;
  }
};

export const getSavedPhotos = async () => {
  await delay();
  try {
    const photos = await getPhotos();
    return photos.filter(photo => photo.savedByMe);
  } catch (error) {
    return [];
  }
};

// Tag API
export const getTags = async () => {
  await delay();
  try {
    const tags = await AsyncStorage.getItem(STORAGE_KEYS.TAGS);
    return tags ? JSON.parse(tags) : mockData.tags;
  } catch (error) {
    return mockData.tags;
  }
};

export const createTag = async (tagName) => {
  await delay(300);
  try {
    const tags = await getTags();
    const newTag = {
      id: tags.length + 1,
      name: tagName.startsWith('#') ? tagName : `#${tagName}`,
      usageCount: 0
    };
    const updatedTags = [...tags, newTag];
    await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(updatedTags));
    return newTag;
  } catch (error) {
    throw error;
  }
};

export const deleteTag = async (tagId) => {
  await delay(300);
  try {
    const tags = await getTags();
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(updatedTags));
    return true;
  } catch (error) {
    throw error;
  }
};

// Seat API
export const getSeats = async () => {
  await delay();
  try {
    const seats = await AsyncStorage.getItem(STORAGE_KEYS.SEATS);
    const parsedSeats = seats ? JSON.parse(seats) : mockData.seats;
    // Normalize all boolean values
    return parsedSeats.map(normalizeSeat);
  } catch (error) {
    // Also normalize mockData.seats
    return mockData.seats.map(normalizeSeat);
  }
};

export const getMySeat = async (phone) => {
  await delay();
  try {
    const seats = await getSeats();
    return seats.find(seat => seat.guestPhone === phone);
  } catch (error) {
    return null;
  }
};

export const getGuests = async () => {
  await delay();
  try {
    const guests = await AsyncStorage.getItem(STORAGE_KEYS.GUESTS);
    return guests ? JSON.parse(guests) : mockData.guests;
  } catch (error) {
    return mockData.guests;
  }
};

export const assignSeat = async (guestId, tableNumber, seatNumber) => {
  await delay(300);
  try {
    const guests = await getGuests();
    const updatedGuests = guests.map(guest => {
      if (guest.id === guestId) {
        return {
          ...guest,
          seatAssigned: `Table ${tableNumber} - Seat ${seatNumber}`
        };
      }
      return guest;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(updatedGuests));
    return true;
  } catch (error) {
    throw error;
  }
};

// RSVP API
export const submitRSVP = async (rsvpData) => {
  await delay(500);
  try {
    // Just simulate success
    return { success: true, message: "感谢您的回复！我们期待在婚礼上见到您。" };
  } catch (error) {
    throw error;
  }
};

// Theme API
export const getTheme = async () => {
  try {
    const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    return theme || 'romantic';
  } catch (error) {
    return 'romantic';
  }
};

export const setTheme = async (themeId) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, themeId);
    return true;
  } catch (error) {
    throw error;
  }
};

// User API
export const getUserPhone = async () => {
  try {
    const phone = await AsyncStorage.getItem(STORAGE_KEYS.USER_PHONE);
    return phone || '+60164226901';
  } catch (error) {
    return '+60164226901';
  }
};

export const setUserPhone = async (phone) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PHONE, phone);
    return true;
  } catch (error) {
    throw error;
  }
};

// Static data (no storage needed)
export const getWeddingInfo = async () => {
  await delay();
  return mockData.weddingInfo;
};

export const getGroomProfile = async () => {
  await delay();
  return mockData.groomProfile;
};

export const getBrideProfile = async () => {
  await delay();
  return mockData.brideProfile;
};

export const getVideos = async () => {
  await delay();
  return mockData.videos;
};

export const getTimeline = async () => {
  await delay();
  return mockData.timeline;
};

export const getNotifications = async () => {
  await delay();
  return mockData.notifications;
};




