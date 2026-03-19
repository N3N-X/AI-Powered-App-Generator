/**
 * RUX Prompts — Authentication proxy service code generator
 */

export function buildAuthServiceCode(): string {
  return `
// Authentication with error handling
export const auth = {
  signup: async (email: string, password: string, name?: string, metadata?: any) => {
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'signup', email, password, name, metadata, anonymousSessionToken: getSessionToken() })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Signup failed');
      }
      if (result.sessionToken) {
        setSessionToken(result.sessionToken);
        await _storage.setItem('rux_session_token', result.sessionToken);
      }
      return result;
    } catch (error) {
      console.error('Auth signup error:', error);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'login', email, password })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        const msg = result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Login failed';
        throw new Error(msg);
      }
      if (result.sessionToken) {
        setSessionToken(result.sessionToken);
        await _storage.setItem('rux_session_token', result.sessionToken);
      }
      return result;
    } catch (error: any) {
      console.error('Auth login error:', error?.message || error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const token = getSessionToken();
      if (!token) return { success: true, message: 'No active session' };
      const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'logout', sessionToken: token })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Logout failed');
      }
      setSessionToken(null);
      await _storage.removeItem('rux_session_token');
      return result;
    } catch (error) {
      console.error('Auth logout error:', error);
      throw error;
    }
  },

  me: async () => {
    try {
      const token = getSessionToken();
      if (!token) return { success: false, user: null };
      const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'me', sessionToken: token })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        return { success: false, user: null };
      }
      // Anonymous sessions are internal — don't treat as logged-in users
      if (result.user?.isAnonymous) {
        return { success: false, user: null };
      }
      return result;
    } catch (error) {
      console.error('Auth me error:', error);
      return { success: false, user: null };
    }
  },

  updateProfile: async (name?: string, avatarUrl?: string, metadata?: any) => {
    try {
      const token = getSessionToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'updateProfile', sessionToken: token, name, avatarUrl, metadata })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Failed to update profile');
      }
      return result;
    } catch (error) {
      console.error('Auth updateProfile error:', error);
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const token = getSessionToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'changePassword', sessionToken: token, currentPassword, newPassword })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Failed to change password');
      }
      return result;
    } catch (error) {
      console.error('Auth changePassword error:', error);
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'forgotPassword', email })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Failed to send reset email');
      }
      return result;
    } catch (error) {
      console.error('Auth forgotPassword error:', error);
      throw error;
    }
  },

  deleteAccount: async (password: string) => {
    try {
      const token = getSessionToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'deleteAccount', sessionToken: token, password })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Failed to delete account');
      }
      return result;
    } catch (error) {
      console.error('Auth deleteAccount error:', error);
      throw error;
    }
  }
};`;
}
