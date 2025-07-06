import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyRound, ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { ENDPOINTS, api } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/auth';

const { width, height } = Dimensions.get('window');

export default function OTP() {
  const { email } = useLocalSearchParams();
  const { setAuthenticated } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [artistStageName, setArtistStageName] = useState('');
  const [showArtistNameInput, setShowArtistNameInput] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const countdown = timer > 0 && setInterval(() => setTimer(timer - 1), 1000);
    return () => clearInterval(countdown as NodeJS.Timeout);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    console.log('Starting OTP verification...');
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter the complete OTP'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Sending verification request...');
      const response = await api.post(ENDPOINTS.VERIFY_OTP, {
        email,
        otp: otpValue
      });

      console.log('Verification response:', response.data);

      if (response.data?.user?.role === 'artist' && !response.data?.user?.artist_stage_name) {
        setShowArtistNameInput(true);
        setLoading(false);
        return;
      }

      // Store the authentication token
      if (response.data?.token) {
        console.log('Storing auth token...');
        await AsyncStorage.setItem('auth_token', response.data.token);
        setAuthenticated(true); // Update auth context
      } else {
        throw new Error('No authentication token received');
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP verified successfully!'
      });

      // The auth context will handle the navigation
    } catch (error: any) {
      console.error('Verification error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Invalid OTP. Please try again.'
      });
      setLoading(false);
    }
  };

  const handleArtistNameSubmit = async () => {
    if (!artistStageName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your artist name'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/updateArtistName', {
        email,
        artist_stage_name: artistStageName.trim()
      });

      if (response.data?.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        setAuthenticated(true);
      } else {
        throw new Error('No authentication token received');
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Artist name set successfully!'
      });
    } catch (error: any) {
      console.error('Artist name update error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update artist name'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;

    setResending(true);
    try {
      console.log('Resending OTP...');
      await api.post(ENDPOINTS.GET_OTP, { email });
      
      setTimer(30);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP has been resent'
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to resend OTP'
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#FFD700" />
      </TouchableOpacity>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.mainContent}>
          {showArtistNameInput ? (
            <>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <KeyRound size={32} color="#FFD700" />
                </View>
                <Text style={styles.title}>Set Your Artist Name</Text>
                <Text style={styles.subtitle}>
                  Please enter your artist name to continue
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.artistInput}
                  placeholder="Enter your artist name"
                  placeholderTextColor="rgba(255, 215, 0, 0.5)"
                  value={artistStageName}
                  onChangeText={setArtistStageName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity 
                style={[styles.verifyButton, loading && styles.disabledButton]}
                onPress={handleArtistNameSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1E40AF" />
                ) : (
                  <Text style={styles.verifyButtonText}>CONTINUE</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <KeyRound size={32} color="#FFD700" />
                </View>
                <Text style={styles.title}>Verify your email</Text>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit code to{'\n'}
                  <Text style={styles.emailText}>{email}</Text>
                </Text>
              </View>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => inputRefs.current[index] = ref}
                    style={[styles.otpInput, loading && styles.disabledInput]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.verifyButton, loading && styles.disabledButton]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1E40AF" />
                ) : (
                  <Text style={styles.verifyButtonText}>VERIFY</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Didn't receive the code? </Text>
                <TouchableOpacity 
                  onPress={handleResend}
                  disabled={timer > 0 || resending}
                >
                  {resending ? (
                    <ActivityIndicator color="#FFD700" size="small" />
                  ) : (
                    <Text style={[
                      styles.resendLink,
                      timer > 0 && styles.resendLinkDisabled
                    ]}>
                      Resend {timer > 0 ? `(${timer}s)` : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E40AF',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 40,
    width: '100%',
  },
  otpInput: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    elevation: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  artistInput: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  disabledInput: {
    opacity: 0.7,
  },
  verifyButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#1E40AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
  },
  resendLink: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});