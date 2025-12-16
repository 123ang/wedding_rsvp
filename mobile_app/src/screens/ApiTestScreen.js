/**
 * API Test Screen
 * Test connection to real API
 */

import React, { useState } from 'react';
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
import realApi from '../services/realApi';
import ENV from '../config/api';

export default function ApiTestScreen() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('angjinsheng@gmail.com');
  const [password, setPassword] = useState('920214');

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    setResult(`Running ${testName}...\n`);
    
    try {
      const response = await testFunction();
      setResult(`✅ ${testName} SUCCESS\n\n${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`❌ ${testName} FAILED\n\n${error.message}\n\n${JSON.stringify(error.response?.data || {}, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Health Check',
      action: () => runTest('Health Check', realApi.healthCheck),
    },
    {
      name: 'Admin Login',
      action: () => runTest('Admin Login', () => realApi.adminLogin(email, password)),
    },
    {
      name: 'Get RSVPs',
      action: () => runTest('Get RSVPs', realApi.getAllRSVPs),
    },
    {
      name: 'Check Auth',
      action: () => runTest('Check Auth', realApi.checkAuth),
    },
    {
      name: 'Test RSVP Submit',
      action: () => runTest('RSVP Submit', () => 
        realApi.submitBrideRSVP({
          name: 'Test User',
          email: 'test@example.com',
          phone: '0123456789',
          attending: true,
          number_of_guests: 2,
          relationship: 'Friend',
          remark: 'Test from mobile app',
        })
      ),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Connection Test</Text>
        <Text style={styles.subtitle}>API URL: {ENV.apiUrl}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Credentials</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Tests</Text>
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
        <Text style={styles.resultTitle}>Result:</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
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

