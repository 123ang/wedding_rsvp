import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export const Button = ({ title, onPress, style, textStyle, loading, disabled, theme }) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: theme.primary },
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  disabled: {
    opacity: 0.6
  }
});

