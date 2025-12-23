const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface RegisterResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

// Auth API calls
export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

// Token management
export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// API call with token
export async function fetchWithToken(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
