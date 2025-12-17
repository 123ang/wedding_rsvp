import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import realApi from '../services/realApi';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Guest Login Screen
 * - No password
 * - Uses phone number used in RSVP to verify guest (via real API)
 */
export default function LoginScreen({ navigation }) {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizePhone = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
  };

  const handleLogin = async () => {
    const trimmed = identifier.trim();

    if (!trimmed) {
      Alert.alert(t('login.errorTitle'), t('login.phoneLabel'));
      return;
    }

    setLoading(true);

    try {
      // Normalize phone once
      const target = normalizePhone(trimmed);

      // Super admin bypass (groom & bride)
      const superAdmins = ['01116473648', '0174907632'];
      if (superAdmins.includes(target)) {
        await AsyncStorage.setItem('user_phone', target);
        await AsyncStorage.setItem('user_role', 'super_admin');

        Alert.alert('Welcome 🎉', 'Admin login successful.', [
          {
            text: 'Continue',
            onPress: () => navigation.replace('Main'),
          },
        ]);
        return;
      }

      // Regular guest login: Verify phone number using public endpoint
      let verifyResult;
      try {
        verifyResult = await realApi.verifyPhone(target);
      } catch (apiError) {
        // Handle network/auth errors gracefully
        if (apiError.code === 'ERR_NETWORK') {
          Alert.alert(
            t('login.errorTitle'),
            '无法连接到服务器。\n\n请检查：\n• 网络连接\n• API服务器是否运行\n• 手机和电脑是否在同一网络'
          );
          return;
        }
        if (apiError.response?.status === 404) {
          // Phone not found
          Alert.alert(t('login.notFoundTitle'), t('login.notFoundMessage'));
          return;
        }
        // Re-throw other errors to be handled by outer catch
        throw apiError;
      }

      // Check if phone was found
      if (!verifyResult.found || !verifyResult.guest) {
        Alert.alert(t('login.notFoundTitle'), t('login.notFoundMessage'));
        return;
      }

      const match = verifyResult.guest;

      // Save user phone (normalized) and wedding type for later API calls
      await AsyncStorage.setItem('user_phone', target);
      await AsyncStorage.setItem('user_role', 'guest');
      
      // Store wedding_type (bride or groom) in lowercase to load correct wedding info
      if (match.wedding_type) {
        const normalizedType = String(match.wedding_type).trim().toLowerCase();
        await AsyncStorage.setItem('wedding_type', normalizedType);
      }

      Alert.alert('Welcome 🎉', `Hello ${match.name || 'guest'}!`, [
        {
          text: 'Continue',
          onPress: () => navigation.replace('Main'),
        },
      ]);
    } catch (error) {
      // Only log unexpected errors (not network/auth errors which are already handled)
      if (error.response && error.response.status !== 401 && error.response.status !== 403) {
        console.log('[Login] Unexpected error:', error.response.status, error.response.data);
      }
      
      // Show user-friendly error message for any unhandled errors
      let errorMessage = '登录失败，请重试。';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = '无法连接到服务器。请检查网络连接。';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && !error.message.includes('Network Error')) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('login.errorTitle'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

        <Text style={styles.label}>{t('login.phoneLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('login.placeholder')}
          keyboardType="phone-pad"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('login.button')}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>{t('login.helper')}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});


