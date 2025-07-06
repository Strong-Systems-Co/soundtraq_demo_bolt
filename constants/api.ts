import axios from 'axios';

export const API_URL = 'https://soundtraq-server.strongsystemsltd.com';
export const APP_URL = 'https://soundtraq.strongsystemsltd.com';

export const ENDPOINTS = {
  SIGNUP: `/signup`,
  GET_OTP: `/getotp`,
  VERIFY_OTP: `/verifyotp`,
} as const;

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Add CORS headers
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept',
  },
  timeout: 200000, // 10 second timeout
});

// Error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Network errors
    if (!error.response) {
      console.error('Network Error:', error);
      return Promise.reject({
        message: 'Network error. Please check your connection.'
      });
    }

    // Log the error for debugging
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });

    // Handle specific error codes
    switch (error.response.status) {
      case 400:
        return Promise.reject({
          message: error.response.data?.message || 'Invalid request. Please check your input.'
        });
      case 401:
        return Promise.reject({
          message: error.response.data?.message ||  'Unauthorized. Please try again.'
        });
      case 404:
        return Promise.reject({
         message: error.response.data?.message || 'Service not found. Please try again later.'
        });
      case 429:
        return Promise.reject({
          message: error.response.data?.message || 'Too many attempts. Please try again later.'
        });
      case 500:
      case 502:
      case 503:
      case 504:
        return Promise.reject({
          message: error.response.data?.message || 'Server error. Please try again later.'
        });
      default:
        return Promise.reject({
          message: error.response.data?.message || 'An unexpected error occurred.'
        });
    }
  }
);

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);