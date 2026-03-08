import { PropsWithChildren, useEffect } from 'react';

import { configureApiClient, resolveApiBaseUrl } from '../utils/api';

export const ApiBootstrap = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    configureApiClient();
  }, []);

  return <>{children}</>;
};

export const useApiBaseUrlLabel = () => resolveApiBaseUrl();
