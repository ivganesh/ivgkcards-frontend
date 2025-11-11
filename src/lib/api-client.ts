import axios from 'axios';
import { env } from '@/config/env';
import { authStorage } from '@/lib/auth-storage';

declare global {
  interface Window {
    __IVGK_ACCESS_TOKEN__?: string;
  }
}

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('ivgk_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const refreshToken = window.localStorage.getItem('ivgk_refresh_token');
      if (!refreshToken) {
        authStorage.clear();
        throw error;
      }

      try {
        const refreshResponse = await axios.post(
          `${env.apiBaseUrl}/auth/refresh`,
          {
            refreshToken,
          },
        );

        const { accessToken } = refreshResponse.data as {
          accessToken: string;
        };

        window.localStorage.setItem('ivgk_access_token', accessToken);
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        authStorage.clear();
        throw refreshError;
      }
    }

    throw error;
  },
);
