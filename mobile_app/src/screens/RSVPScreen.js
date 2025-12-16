/**
 * RSVP Screen
 * Submit RSVP to real API
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
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import realApi from '../services/realApi';
import { useMutation } from '../hooks/useApi';
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
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    attending: true,
    number_of_guests: '1',
    organization: '',
    relationship: '',
    remark: '',
  });

  const { mutate: submitRSVP, loading } = useMutation(
    weddingType === 'bride' ? realApi.submitBrideRSVP : realApi.submitGroomRSVP
  );

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert(t('rsvp.errorTitle'), t('rsvp.field.name'));
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert(t('rsvp.errorTitle'), t('rsvp.field.phone'));
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim(),
        attending: formData.attending === true,
        number_of_guests: parseInt(formData.number_of_guests) || 1,
      };

      // Add optional fields
      if (weddingType === 'groom' && formData.organization) {
        payload.organization = formData.organization;
      }
      if (formData.relationship) {
        payload.relationship = formData.relationship;
      }
      if (formData.remark) {
        payload.remark = formData.remark;
      }

      await submitRSVP(payload);
      
      Alert.alert(
        t('rsvp.successTitle'),
        t('rsvp.successMessage'),
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        t('rsvp.errorTitle'),
        error.response?.data?.message || error.message || 'Failed to submit RSVP. Please try again.'
      );
    }
  };

  // Options for selects
  const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => ({
    value: num.toString(),
    label: t('rsvp.guests.label', { count: num }),
  }));

  const organizationOptions = [
    { value: '', label: '请选择' },
    { value: '新郎同事', label: '新郎同事' },
    { value: '新郎朋友', label: '新郎朋友' },
    { value: '新郎家人', label: '新郎家人' },
    { value: '其他', label: '其他' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {weddingType === 'bride' ? t('rsvp.titleBride') : t('rsvp.titleGroom')}
          </Text>
          <Text style={styles.subtitle}>{t('rsvp.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('rsvp.field.name')}</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入您的姓名"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('rsvp.field.email')}</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('rsvp.field.phone')}</Text>
            <TextInput
              style={styles.input}
              placeholder="01X-XXXXXXX"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              keyboardType="phone-pad"
            />
          </View>

          {/* Attending */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('rsvp.field.attending')}</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, formData.attending === true && styles.radioButtonActive]}
                onPress={() => updateField('attending', true)}
              >
                <Text style={[styles.radioText, formData.attending === true && styles.radioTextActive]}>
                  {t('rsvp.attending.yes')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, formData.attending === false && styles.radioButtonActive]}
                onPress={() => updateField('attending', false)}
              >
                <Text style={[styles.radioText, formData.attending === false && styles.radioTextActive]}>
                  {t('rsvp.attending.no')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Number of Guests */}
          {formData.attending === true && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('rsvp.field.guests')}</Text>
              <SimpleSelect
                value={formData.number_of_guests}
                options={guestOptions}
                onValueChange={(value) => updateField('number_of_guests', value)}
                placeholder="选择人数"
              />
            </View>
          )}

          {/* Organization (Groom only) */}
          {weddingType === 'groom' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('rsvp.field.organization')}</Text>
              <SimpleSelect
                value={formData.organization}
                options={organizationOptions}
                onValueChange={(value) => updateField('organization', value)}
                placeholder="请选择"
              />
            </View>
          )}

          {/* Relationship */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('rsvp.field.relationship')}</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：新郎朋友、新娘同事"
              value={formData.relationship}
              onChangeText={(text) => updateField('relationship', text)}
            />
          </View>

          {/* Remark */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('rsvp.field.remark')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="有什么想告诉我们的吗？"
              value={formData.remark}
              onChangeText={(text) => updateField('remark', text)}
              multiline={Boolean(true)}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading === true && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={Boolean(loading)}
          >
            {loading === true ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>{t('rsvp.submit')}</Text>
            )}
          </TouchableOpacity>
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
