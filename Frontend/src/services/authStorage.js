const AUTH_STORAGE_KEY = "fb_auth";

export const readAuthStorage = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);

    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const writeAuthStorage = (authState) => {
  if (!authState?.user || !authState?.accessToken || !authState?.refreshToken) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
};

export const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};