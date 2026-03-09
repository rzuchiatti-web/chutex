const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
export const API_URL = BACKEND_URL || '';

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `Erreur ${response.status}` }));
      throw new Error(error.detail || `Erreur ${response.status}`);
    }
    return response.json();
  } catch (e: any) {
    if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('Network') || e.message.includes('fetch') || e.message.includes('Load failed'))) {
      throw new Error('Erreur de connexion. Verifiez votre connexion internet.');
    }
    throw e;
  }
};
