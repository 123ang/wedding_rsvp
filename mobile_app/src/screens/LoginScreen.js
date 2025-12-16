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

      // Regular guest login: Use RSVPs table from backend and match by normalized phone number
      const all = await realApi.getAllRSVPs();

      const match = Array.isArray(all)
        ? all.find((r) => normalizePhone(r.phone) === target)
        : null;

      if (!match) {
        Alert.alert(t('login.notFoundTitle'), t('login.notFoundMessage'));
        return;
      }

      // Save user phone (normalized) for later API calls
      await AsyncStorage.setItem('user_phone', target);

      Alert.alert('Welcome 🎉', `Hello ${match.name || 'guest'}!`, [
        {
          text: 'Continue',
          onPress: () => navigation.replace('Main'),
        },
      ]);
    } catch (error) {
      console.log('[Login] error:', error);
      Alert.alert(
        t('login.errorTitle'),
        error?.response?.data?.message ||
          error?.message ||
          'Login failed. Please try again.'
      );
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


