import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { User, Mail, Phone, ArrowLeft, Music } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { ENDPOINTS, api } from '@/constants/api';

type UserType = 'regular' | 'artist';

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '+256',
    artistName: '',
  });
  const [userType, setUserType] = useState<UserType>('regular');
  const [loading, setLoading] = useState(false);

  const validatePhone = (phoneNumber: string) => {
    console.log('Validating phone number:', phoneNumber);
    const phoneRegex = /^\+256[0-9]{9}$/;
    const isValid = phoneRegex.test(phoneNumber);
    console.log('Phone validation result:', isValid);
    return isValid;
  };

  const handlePhoneChange = (value: string) => {
    console.log('Phone input changed:', value);
    const cleaned = value.replace(/[^\d+]/g, '');
    console.log('Cleaned phone number:', cleaned);
    
    if (!cleaned.startsWith('+256')) {
      console.log('Resetting to default prefix +256');
      setFormData(prev => ({ ...prev, phone: '+256' }));
    } else if (cleaned.length <= 13) {
      console.log('Setting new phone number:', cleaned);
      setFormData(prev => ({ ...prev, phone: cleaned }));
    }
  };

  const handleSignUp = async () => {
    if (loading) return;
    
    console.log('Starting signup process...');
    console.log('Form data:', formData);

    // Validate required fields
    if (!formData.username || !formData.email) {
      console.log('Validation failed: Missing required fields');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all required fields'
      });
      return;
    }

    // Validate artist name if user type is artist
    if (userType === 'artist' && !formData.artistName) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your artist name'
      });
      return;
    }

    // Validate email format
    console.log('Validating email:', formData.email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log('Email validation failed');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid email address'
      });
      return;
    }

    if (!validatePhone(formData.phone)) {
      console.log('Phone validation failed');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid Ugandan phone number'
      });
      return;
    }

    console.log('All validations passed, proceeding with signup...');
    setLoading(true);
    try {
      const signupData = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        userType,
        ...(userType === 'artist' && { artistName: formData.artistName }),
      };

      console.log('Sending signup request:', signupData);
      const response = await api.post(ENDPOINTS.SIGNUP, signupData);
      console.log('Signup response:', response.data);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account created successfully! Please login.'
      });

      console.log('Redirecting to login page...');
      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    } catch (error: any) {
      console.error('Signup error:', error);
      let message = 'An error occurred during signup';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      console.log('Showing error toast:', message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message
      });
    } finally {
      setLoading(false);
      console.log('Signup process completed');
    }
  };

  const handleLoginPress = () => {
    if (!loading) {
      router.push('/login');
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <ArrowLeft size={24} color="#FFD700" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <View style={styles.musicNote}>
                <Text style={styles.musicNoteText}>♪</Text>
              </View>
              <View style={styles.recordDisc}>
                <View style={styles.discCenter} />
              </View>
            </View>
            <Text style={styles.logoText}>Create Account</Text>
          </View>

          <View style={styles.userTypeContainer}>
            <TouchableOpacity 
              style={[
                styles.userTypeButton,
                userType === 'regular' && styles.userTypeButtonActive
              ]}
              onPress={() => setUserType('regular')}
              disabled={loading}
            >
              <User 
                size={20} 
                color={userType === 'regular' ? '#1E40AF' : '#FFD700'} 
              />
              <Text style={[
                styles.userTypeText,
                userType === 'regular' && styles.userTypeTextActive
              ]}>Regular User</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.userTypeButton,
                userType === 'artist' && styles.userTypeButtonActive
              ]}
              onPress={() => setUserType('artist')}
              disabled={loading}
            >
              <Music 
                size={20} 
                color={userType === 'artist' ? '#1E40AF' : '#FFD700'} 
              />
              <Text style={[
                styles.userTypeText,
                userType === 'artist' && styles.userTypeTextActive
              ]}>Artist</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color="#FFD700" />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#FFD700"
                value={formData.username}
                onChangeText={(value) => {
                  console.log('Username changed:', value);
                  setFormData(prev => ({ ...prev, username: value }));
                }}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {userType === 'artist' && (
              <View style={styles.inputContainer}>
                <Music size={20} color="#FFD700" />
                <TextInput
                  style={styles.input}
                  placeholder="Artist Name"
                  placeholderTextColor="#FFD700"
                  value={formData.artistName}
                  onChangeText={(value) => {
                    setFormData(prev => ({ ...prev, artistName: value }));
                  }}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Mail size={20} color="#FFD700" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#FFD700"
                value={formData.email}
                onChangeText={(value) => {
                  console.log('Email changed:', value);
                  setFormData(prev => ({ ...prev, email: value }));
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color="#FFD700" />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#FFD700"
                value={formData.phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.signUpButton, loading && styles.disabledButton]} 
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signUpButtonText}>
                {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={handleLoginPress}
              disabled={loading}
              style={styles.loginButton}
            >
              <Text style={styles.loginLink}>Login</Text>
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
    padding: 20,
    gap: 30,
    minHeight: Platform.OS === 'web' ? 800 : 700,
  },
  backButton: {
    marginTop: 40,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
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
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  userTypeButtonActive: {
    backgroundColor: '#FFD700',
  },
  userTypeText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  userTypeTextActive: {
    color: '#1E40AF',
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
  signUpButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signUpButtonText: {
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
  loginButton: {
    padding: 4,
  },
  loginLink: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
});