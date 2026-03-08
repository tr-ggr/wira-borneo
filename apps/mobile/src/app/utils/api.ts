import axios from 'axios';
import { Platform } from 'react-native';
import { setApiClientBaseUrl } from '@wira-borneo/api-client';

const NATIVE_ANDROID_EMULATOR_BASE = 'http://10.0.2.2:5555';
const NATIVE_LOCALHOST_BASE = 'http://localhost:5555';

const getWebBaseUrl = () => {
  if (typeof window === 'undefined') {
    return NATIVE_LOCALHOST_BASE;
  }

  const host = window.location.hostname || 'localhost';
  return `http://${host}:5555`;
};

export const resolveApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return getWebBaseUrl();
  }

  if (Platform.OS === 'android') {
    return NATIVE_ANDROID_EMULATOR_BASE;
  }

  return NATIVE_LOCALHOST_BASE;
};

export const configureApiClient = () => {
  const baseUrl = resolveApiBaseUrl();
  setApiClientBaseUrl(baseUrl);
  axios.defaults.baseURL = baseUrl;
  axios.defaults.withCredentials = true;
  axios.defaults.timeout = 10000;
};
