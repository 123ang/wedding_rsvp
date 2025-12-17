/**
 * API Test Screen
 * Comprehensive test for all mobile app API endpoints
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import realApi from '../services/realApi';
import ENV from '../config/api';

export default function ApiTestScreen() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('01116473648'); // Super admin phone
  const [userPhone, setUserPhone] = useState('');
  const [testPhotoId, setTestPhotoId] = useState('');

  useEffect(() => {
    loadStoredPhone();
  }, []);

  const loadStoredPhone = async () => {
    try {
      const phone = await AsyncStorage.getItem('user_phone');
      if (phone) {
        setUserPhone(phone);
        setTestPhone(phone);
      }
    } catch (e) {
      console.log('Error loading stored phone:', e);
    }
  };

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    setResult(`🔄 Running ${testName}...\n`);
    
    try {
      const startTime = Date.now();
      const response = await testFunction();
      const duration = Date.now() - startTime;
      
      const responseStr = typeof response === 'object' 
        ? JSON.stringify(response, null, 2) 
        : String(response);
      
      setResult(`✅ ${testName} SUCCESS (${duration}ms)\n\n${responseStr.substring(0, 1000)}${responseStr.length > 1000 ? '...\n(truncated)' : ''}`);
    } catch (error) {
      const errorDetails = error.response?.data 
        ? JSON.stringify(error.response.data, null, 2)
        : error.message;
      setResult(`❌ ${testName} FAILED\n\nError: ${error.message}\n\n${errorDetails.substring(0, 500)}${errorDetails.length > 500 ? '...\n(truncated)' : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: '1. Health Check',
      action: () => runTest('Health Check', realApi.healthCheck),
    },
    {
      name: '2. Guest Login (Phone)',
      action: () => runTest('Guest Login', async () => {
        const normalizePhone = (value) => value ? value.replace(/\D/g, '') : '';
        const target = normalizePhone(testPhone);
        
        // Super admin check
        if (target === '01116473648' || target === '0174907632') {
          await AsyncStorage.setItem('user_phone', target);
          await AsyncStorage.setItem('user_role', 'super_admin');
          return { success: true, message: 'Super admin login successful', phone: target };
        }
        
        // Regular guest check
        const all = await realApi.getAllRSVPs();
        const match = Array.isArray(all) 
          ? all.find((r) => normalizePhone(r.phone) === target)
          : null;
        
        if (!match) {
          throw new Error('Phone number not found in RSVPs');
        }
        
        await AsyncStorage.setItem('user_phone', target);
        return { success: true, message: 'Login successful', guest: match };
      }),
    },
    {
      name: '3. Get All RSVPs',
      action: () => runTest('Get All RSVPs', async () => {
        const data = await realApi.getAllRSVPs();
        return { count: Array.isArray(data) ? data.length : 0, sample: Array.isArray(data) ? data[0] : data };
      }),
    },
    {
      name: '4. Get Wedding Info',
      action: () => runTest('Get Wedding Info', realApi.getWeddingInfo),
    },
    {
      name: '5. Get Groom Profile',
      action: () => runTest('Get Groom Profile', realApi.getGroomProfile),
    },
    {
      name: '6. Get Bride Profile',
      action: () => runTest('Get Bride Profile', realApi.getBrideProfile),
    },
    {
      name: '7. Get Seats',
      action: () => runTest('Get Seats', async () => {
        const data = await realApi.getSeats();
        return { count: Array.isArray(data) ? data.length : 0, sample: Array.isArray(data) ? data[0] : data };
      }),
    },
    {
      name: '8. Get My Seat',
      action: () => runTest('Get My Seat', () => {
        if (!testPhone) throw new Error('Please enter phone number');
        return realApi.getMySeat(testPhone.replace(/\D/g, ''));
      }),
    },
    {
      name: '9. Get Photos',
      action: () => runTest('Get Photos', async () => {
        const phone = await AsyncStorage.getItem('user_phone');
        const data = await realApi.getPhotos(1, 10, phone);
        const photos = Array.isArray(data) ? data : (data.photos || []);
        if (photos.length > 0) setTestPhotoId(photos[0].id);
        return { count: photos.length, sample: photos[0] || null };
      }),
    },
    {
      name: '10. Get Tags',
      action: () => runTest('Get Tags', async () => {
        const data = await realApi.getTags();
        return { count: Array.isArray(data) ? data.length : 0, tags: Array.isArray(data) ? data : [] };
      }),
    },
    {
      name: '11. Get Videos',
      action: () => runTest('Get Videos', async () => {
        const data = await realApi.getVideos();
        return { count: Array.isArray(data) ? data.length : 0, sample: Array.isArray(data) ? data[0] : data };
      }),
    },
    {
      name: '12. Get Timeline',
      action: () => runTest('Get Timeline', async () => {
        const data = await realApi.getTimeline();
        return { count: Array.isArray(data) ? data.length : 0, sample: Array.isArray(data) ? data[0] : data };
      }),
    },
    {
      name: '13. Like Photo',
      action: () => runTest('Like Photo', async () => {
        if (!testPhotoId) throw new Error('No photo ID. Run "Get Photos" first.');
        const phone = await AsyncStorage.getItem('user_phone');
        if (!phone) throw new Error('Please login first');
        return realApi.likePhoto(testPhotoId, phone);
      }),
    },
    {
      name: '14. Add Comment',
      action: () => runTest('Add Comment', async () => {
        if (!testPhotoId) throw new Error('No photo ID. Run "Get Photos" first.');
        const phone = await AsyncStorage.getItem('user_phone');
        if (!phone) throw new Error('Please login first');
        return realApi.addComment(testPhotoId, 'Test User', phone, 'Test comment from mobile app');
      }),
    },
    {
      name: '15. Upload Photo',
      action: () => runTest('Upload Photo', async () => {
        const phone = await AsyncStorage.getItem('user_phone');
        if (!phone) throw new Error('Please login first');
        
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Permission to access media library is required');
        }
        
        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
        
        if (result.canceled) {
          throw new Error('Image selection canceled');
        }
        
        // Create FormData
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'test-photo.jpg',
        });
        formData.append('caption', 'Test photo upload from mobile app');
        formData.append('user_phone', phone);
        
        const response = await realApi.uploadPhoto(formData);
        if (response.id) setTestPhotoId(response.id);
        return response;
      }),
    },
    {
      name: '16. Submit Bride RSVP',
      action: () => runTest('Submit Bride RSVP', () => 
        realApi.submitBrideRSVP({
          name: 'Test User Mobile',
          email: 'testmobile@example.com',
          phone: testPhone.replace(/\D/g, '') || '0123456789',
          attending: true,
          number_of_guests: 1,
          relationship: 'Friend',
          remark: 'Test RSVP from mobile app',
        })
      ),
    },
  ];

  const runAllTests = async () => {
    setResult('🚀 Running all tests...\n\n');
    setLoading(true);
    
    const results = [];
    for (const test of tests) {
      try {
        const startTime = Date.now();
        await test.action();
        const duration = Date.now() - startTime;
        results.push(`✅ ${test.name} (${duration}ms)`);
      } catch (error) {
        results.push(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    setResult(`📊 Test Results:\n\n${results.join('\n')}\n\n✅ Passed: ${results.filter(r => r.includes('✅')).length}\n❌ Failed: ${results.filter(r => r.includes('❌')).length}`);
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Test Suite</Text>
        <Text style={styles.subtitle}>API URL: {ENV.apiUrl}</Text>
        {userPhone ? (
          <Text style={styles.subtitle}>Logged in as: {userPhone}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Phone Number</Text>
        <Text style={styles.sectionDesc}>Enter phone for login/guest tests</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone number (e.g., 01116473648)"
          value={testPhone}
          onChangeText={setTestPhone}
          keyboardType="phone-pad"
        />
        {userPhone ? (
          <Text style={styles.infoText}>Current user: {userPhone}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.runAllButton, loading && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={Boolean(loading)}
        >
          <Text style={styles.runAllButtonText}>🚀 Run All Tests</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Individual Tests</Text>
        {tests.map((test, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={test.action}
            disabled={Boolean(loading)}
          >
            <Text style={styles.buttonText}>{test.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B9D" />
          <Text style={styles.loadingText}>Testing...</Text>
        </View>
      )}

      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Test Results:</Text>
        <ScrollView style={styles.resultScroll} nestedScrollEnabled={Boolean(true)}>
          <Text style={styles.resultText}>{result || 'No result yet. Run a test above.'}</Text>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF6B9D',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
  },
  infoText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: -5,
    marginBottom: 10,
  },
  runAllButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  runAllButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FF6B9D',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  resultContainer: {
    backgroundColor: '#1e1e1e',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    minHeight: 200,
    maxHeight: 400,
  },
  resultTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultScroll: {
    maxHeight: 350,
  },
  resultText: {
    color: '#4CAF50',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});

