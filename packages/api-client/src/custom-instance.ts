import axios, { AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = axios.create({
  baseURL: 'http://localhost:3333', // Default base URL
  withCredentials: true,
});

// Add a second `options` argument to pass extra options to each query
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  })
    .then(({ data }) => data)
    .catch((error) => {
      // Normalize error response
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'An unexpected error occurred';
      
      const normalizedError = new Error(message);
      // @ts-ignore
      normalizedError.response = error.response;
      // @ts-ignore
      normalizedError.status = error.response?.status;
      
      throw normalizedError;
    });

  // @ts-expect-error - cancel property is added to promise
  promise.cancel = () => {
    source.cancel('Query was cancelled by React Query');
  };

  return promise;
};

// In case you want to wrap the error, you can use something like this
// export type ErrorType<Error> = AxiosError<Error>;

// In case you want to wrap the body, you can use something like this
// export type BodyType<BodyData> = BodyData;
