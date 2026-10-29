/**
 * Platform and runtime detection for Web and Mobile (Android / iOS)
 */

export const isNativePlatform = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    window._capacitorNative !== undefined
  );
};

export const getPlatform = () => {
  if (typeof window === 'undefined') return 'web';
  if (window.Capacitor?.getPlatform) {
    return window.Capacitor.getPlatform();
  }
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/android/i.test(userAgent)) return 'android';
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios';
  return 'web';
};

export const getApiBaseUrl = () => {
  // 1. Explicit environment variable during build
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. User-configured custom server URL (stored in localStorage for easy mobile dev/testing)
  const savedUrl = localStorage.getItem('invoxa_api_url');
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim();
  }

  // 3. Native mobile apps cannot use relative paths like '/api' because they run from capacitor://
  if (isNativePlatform()) {
    const platform = getPlatform();
    // Default production endpoint or local Android emulator gateway
    if (import.meta.env.DEV) {
      return platform === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
    }
    return 'https://api.invoxa.com/api';
  }

  // 4. Standard Web Browser deployment (uses relative reverse-proxy or same host)
  return '/api';
};

export const setApiBaseUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('invoxa_api_url', url.trim());
    } else {
      localStorage.removeItem('invoxa_api_url');
    }
  }
};

export const resetApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('invoxa_api_url');
  }
};
