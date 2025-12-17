/**
 * RSVP Screen
 * View RSVP information from real API (read-only)
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
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import realApi from '../services/realApi';
import { useLanguage } from '../contexts/LanguageContext';

// Simple Select Component that works on both web and mobile
const SimpleSelect = ({ value, options, onValueChange, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  return (
    <>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectButtonText, !selectedOption && styles.selectPlaceholder]}>
          {selectedOption ? selectedOption.label : placeholder || '请选择'}
        </Text>
        <Text style={styles.selectArrow}>▼</Text>
      </TouchableOpacity>
      
      <Modal
        visible={Boolean(modalVisible)}
        transparent={Boolean(true)}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>请选择</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    value === item.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    value === item.value && styles.modalOptionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {value === item.value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default function RSVPScreen({ navigation, route }) {
  const weddingType = route?.params?.type || 'bride'; // 'bride' or 'groom'
  const { t } = useLanguage();
  const [rsvp, setRsvp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRsvp = async () => {
      console.log('[RSVP Screen] Loading RSVP data...');
      console.log('[RSVP Screen] Wedding type:', weddingType);
      try {
        const phone = await AsyncStorage.getItem('user_phone');
        console.log('[RSVP Screen] User phone from storage:', phone ? `${phone.substring(0, 3)}***` : 'NOT FOUND');
        if (!phone) {
          console.log('[RSVP Screen] ERROR: No phone number found in storage');
          Alert.alert(t('rsvp.errorTitle'), '请先登录后再查看出席信息。', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }

        console.log('[RSVP Screen] Calling verifyPhone API...');
        const verifyResult = await realApi.verifyPhone(phone);
        console.log('[RSVP Screen] verifyPhone response:', {
          found: verifyResult.found,
          rsvpsCount: verifyResult.rsvps?.length || 0,
          rsvps: verifyResult.rsvps?.map(r => ({
            id: r.id,
            name: r.name,
            wedding_type: r.wedding_type,
            attending: r.attending
          })) || []
        });
        
        if (!verifyResult.found || !verifyResult.rsvps || verifyResult.rsvps.length === 0) {
          console.log('[RSVP Screen] ERROR: No RSVPs found for this phone number');
          Alert.alert(t('rsvp.errorTitle'), t('rsvp.notFound'));
          navigation.goBack();
          return;
        }

        // Prefer RSVP that matches this screen's weddingType
        // If user has bride_groom type, show it for both bride and groom screens
        let match = verifyResult.rsvps.find((r) => r.wedding_type === weddingType);
        if (!match) {
          // Check if user has bride_groom type (show it for both bride and groom screens)
          match = verifyResult.rsvps.find((r) => r.wedding_type === 'bride_groom');
        }
        // Fallback to first RSVP if no match found
        if (!match) {
          match = verifyResult.rsvps[0];
        }
        console.log('[RSVP Screen] Selected RSVP match:', {
          id: match.id,
          name: match.name,
          wedding_type: match.wedding_type,
          attending: match.attending,
          guests: match.number_of_guests,
          seat_table: match.seat_table
        });
        setRsvp(match);
        console.log('[RSVP Screen] RSVP data loaded successfully');
      } catch (error) {
        console.error('[RSVP Screen] ERROR loading RSVP:', error);
        console.error('[RSVP Screen] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        Alert.alert(t('rsvp.errorTitle'), '无法加载出席信息，请稍后再试。');
        navigation.goBack();
      } finally {
        setLoading(false);
        console.log('[RSVP Screen] Loading complete');
      }
    };

    loadRsvp();
  }, [navigation, route, t, weddingType]);

  const renderSeatInfo = () => {
    if (!rsvp) return '';
    if (!rsvp.seat_table) {
      return t('seat.pending');
    }
    return `${t('seat.tablePrefix')} ${rsvp.seat_table}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {weddingType === 'bride' ? t('rsvp.titleBride') : t('rsvp.titleGroom')}
          </Text>
        </View>

        <View style={styles.form}>
          {loading && (
            <ActivityIndicator size="large" color="#FF6B9D" style={{ marginTop: 20 }} />
          )}

          {!loading && rsvp && (
            <>
              {/* Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('rsvp.field.name')}</Text>
                <Text style={styles.valueText}>{rsvp.name}</Text>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('rsvp.field.email')}</Text>
                <Text style={styles.valueText}>{rsvp.email || '-'}</Text>
              </View>

              {/* Phone */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('rsvp.field.phone')}</Text>
                <Text style={styles.valueText}>{rsvp.phone}</Text>
              </View>

              {/* Wedding Type */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('rsvp.field.weddingType') || 'Wedding'}</Text>
                <Text style={styles.valueText}>
                  {rsvp.wedding_type === 'bride' ? 'Bride Wedding' : 
                   rsvp.wedding_type === 'groom' ? 'Groom Wedding' :
                   rsvp.wedding_type === 'bride_groom' ? 'Bride & Groom Wedding' : 'Wedding'}
                </Text>
              </View>

              {/* Attending */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('rsvp.field.attending')}</Text>
                <Text style={styles.valueText}>
                  {rsvp.attending ? t('rsvp.attending.yes') : t('rsvp.attending.no')}
                </Text>
              </View>

              {/* Number of Guests */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('rsvp.field.guests')}</Text>
                <Text style={styles.valueText}>{rsvp.number_of_guests || 1}</Text>
              </View>

              {/* Seat Table from rsvps.seat_table */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Seat</Text>
                <Text style={styles.valueText}>{renderSeatInfo()}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#FF6B9D',
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  form: {
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  valueText: {
    fontSize: 16,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  selectButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectPlaceholder: {
    color: '#999',
  },
  selectArrow: {
    fontSize: 12,
    color: '#666',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  radioButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: '#FF6B9D',
    backgroundColor: '#FFF0F5',
  },
  radioText: {
    fontSize: 16,
    color: '#666',
  },
  radioTextActive: {
    color: '#FF6B9D',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF6B9D',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    paddingVertical: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionSelected: {
    backgroundColor: '#FFF0F5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#FF6B9D',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#FF6B9D',
    fontWeight: 'bold',
  },
});
