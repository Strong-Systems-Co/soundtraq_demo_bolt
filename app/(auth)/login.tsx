import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { ENDPOINTS, api } from '@/constants/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    // Validate email
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your email'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid email address'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Sending OTP request for:', email.trim());
      
      const response = await api.post('https://soundtraq-server.strongsystemsltd.com/getotp', {
        email: email.trim(),
      });

      console.log('Login Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP sent successfully!'
      });

      // Navigate to OTP verification
      router.push({
        pathname: '/otp',
        params: { email: email.trim() }
      });
    } catch (error: any) {
      console.error('Login Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to send OTP'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpPress = () => {
    if (!loading) {
      router.push('/signup');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <View style={styles.musicNote}>
                <Text style={styles.musicNoteText}>♪</Text>
              </View>
              <View style={styles.recordDisc}>
                <View style={styles.discCenter} />
              </View>
            </View>
            <Text style={styles.logoText}>Soundtraq</Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#FFD700" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#FFD700"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1E40AF" />
              ) : (
                <Text style={styles.loginButtonText}>CONTINUE</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={handleSignUpPress}
              disabled={loading}
              style={styles.signUpButton}
            >
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E40AF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 40,
    minHeight: Platform.OS === 'web' ? 600 : 500,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  musicNote: {
    width: 40,
    height: 40,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicNoteText: {
    fontSize: 24,
    color: '#1E40AF',
  },
  recordDisc: {
    width: 40,
    height: 40,
    backgroundColor: '#000',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discCenter: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  logoText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
    paddingBottom: 8,
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
  },
  loginButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#1E40AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
  },
  signUpButton: {
    padding: 4,
  },
  signUpLink: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
});