import { AXIOS_INSTANCE } from './custom-instance';

export const setApiClientBaseUrl = (baseUrl: string): void => {
  const trimmed = baseUrl.trim();
  AXIOS_INSTANCE.defaults.baseURL = trimmed.length > 0 ? trimmed : undefined;
};

export const getApiClientBaseUrl = (): string | undefined =>
  AXIOS_INSTANCE.defaults.baseURL;
