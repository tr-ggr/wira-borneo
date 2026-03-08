import axios from 'axios';

export const setApiClientBaseUrl = (baseUrl: string): void => {
  const trimmed = baseUrl.trim();
  axios.defaults.baseURL = trimmed.length > 0 ? trimmed : undefined;
};

export const getApiClientBaseUrl = (): string | undefined => axios.defaults.baseURL;
