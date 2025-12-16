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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import realApi from '../services/realApi';
import { useMutation } from '../hooks/useApi';

export default function RSVPScreen({ navigation, route }) {
  const weddingType = route?.params?.type || 'bride'; // 'bride' or 'groom'
  
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
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim(),
        attending: formData.attending,
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
        'Success! 🎉',
        'Your RSVP has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Failed to submit RSVP. Please try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {weddingType === 'bride' ? '新娘婚礼 RSVP' : '新郎婚礼 RSVP'}
          </Text>
          <Text style={styles.subtitle}>请填写以下信息确认出席</Text>
        </View>

        <View style={styles.form}>
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>姓名 *</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入您的姓名"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>电子邮件</Text>
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
            <Text style={styles.label}>电话号码 *</Text>
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
            <Text style={styles.label}>是否出席 *</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, formData.attending && styles.radioButtonActive]}
                onPress={() => updateField('attending', true)}
              >
                <Text style={[styles.radioText, formData.attending && styles.radioTextActive]}>
                  ✓ 我会出席
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, !formData.attending && styles.radioButtonActive]}
                onPress={() => updateField('attending', false)}
              >
                <Text style={[styles.radioText, !formData.attending && styles.radioTextActive]}>
                  ✗ 无法出席
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Number of Guests */}
          {formData.attending && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>人数 *</Text>
              <Picker
                selectedValue={formData.number_of_guests}
                onValueChange={(value) => updateField('number_of_guests', value)}
                style={styles.picker}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <Picker.Item key={num} label={`${num} 人`} value={num.toString()} />
                ))}
              </Picker>
            </View>
          )}

          {/* Organization (Groom only) */}
          {weddingType === 'groom' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>单位/组织</Text>
              <Picker
                selectedValue={formData.organization}
                onValueChange={(value) => updateField('organization', value)}
                style={styles.picker}
              >
                <Picker.Item label="请选择" value="" />
                <Picker.Item label="新郎同事" value="新郎同事" />
                <Picker.Item label="新郎朋友" value="新郎朋友" />
                <Picker.Item label="新郎家人" value="新郎家人" />
                <Picker.Item label="其他" value="其他" />
              </Picker>
            </View>
          )}

          {/* Relationship */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>关系</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：新郎朋友、新娘同事"
              value={formData.relationship}
              onChangeText={(text) => updateField('relationship', text)}
            />
          </View>

          {/* Remark */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>备注</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="有什么想告诉我们的吗？"
              value={formData.remark}
              onChangeText={(text) => updateField('remark', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>提交 RSVP</Text>
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
  picker: {
    backgroundColor: 'white',
    borderRadius: 8,
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
});

