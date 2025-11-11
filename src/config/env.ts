const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!configuredBaseUrl) {
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      'NEXT_PUBLIC_API_BASE_URL is not set. Falling back to http://localhost:3000/api. Configure the environment variable for deployed environments.',
    );
  }
}

export const env = {
  apiBaseUrl: configuredBaseUrl || DEFAULT_API_BASE_URL,
};
