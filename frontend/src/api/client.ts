const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE = 
  (import.meta as any).env?.VITE_API_URL || 
  (isLocal ? `http://${window.location.hostname}:8000/api/v1` : '/api/v1');

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('marginmind_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('marginmind_token');
    window.location.hash = '#login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const text = await response.text();
      try {
        const errJson = JSON.parse(text);
        errorDetail = errJson.detail || errorDetail;
      } catch {
        if (text && text.length < 500) {
          errorDetail = text;
        }
      }
    } catch {
      // Stream consumed
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
