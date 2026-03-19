/**
 * RUX Prompts — Database proxy service code generator
 */

export function buildDbServiceCode(): string {
  return `// Database operations with error handling
// scope: 'global' = creator content (recipes, products), 'user' = per-user content (favorites, cart), 'all' = both (default)
export const db = {
  create: async (collection: string, data: any, scope?: 'global' | 'user') => {
    try {
      if (scope === 'user') await initSession();
      const body: any = { collection, operation: 'create', data };
      if (scope) body.scope = scope;
      if (scope === 'user') body.sessionToken = getSessionToken();
      const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
        method: 'POST', headers,
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Failed to create item');
      }
      return result.data;
    } catch (error) {
      console.error('DB create error:', error);
      throw error;
    }
  },

  getAll: async (collection: string, filter?: any, scope?: 'global' | 'user' | 'all') => {
    try {
      if (scope === 'user') await initSession();
      const body: any = { collection, operation: 'findMany', filter };
      if (scope) body.scope = scope;
      if (scope === 'user') body.sessionToken = getSessionToken();
      const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
        method: 'POST', headers,
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Failed to fetch items');
      }
      return result.data || [];
    } catch (error) {
      console.error('DB getAll error:', error);
      return [];
    }
  },

  getOne: async (collection: string, filter: any, scope?: 'global' | 'user' | 'all') => {
    try {
      if (scope === 'user') await initSession();
      const body: any = { collection, operation: 'findOne', filter };
      if (scope) body.scope = scope;
      if (scope === 'user') body.sessionToken = getSessionToken();
      const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
        method: 'POST', headers,
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Failed to fetch item');
      }
      return result.data;
    } catch (error) {
      console.error('DB getOne error:', error);
      return null;
    }
  },

  update: async (collection: string, id: string, data: any, scope?: 'global' | 'user') => {
    try {
      if (scope === 'user') await initSession();
      const body: any = { collection, operation: 'update', filter: { id }, data };
      if (scope) body.scope = scope;
      if (scope === 'user') body.sessionToken = getSessionToken();
      const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
        method: 'POST', headers,
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Failed to update item');
      }
      return result.data;
    } catch (error) {
      console.error('DB update error:', error);
      throw error;
    }
  },

  delete: async (collection: string, id: string, scope?: 'global' | 'user') => {
    try {
      if (scope === 'user') await initSession();
      const body: any = { collection, operation: 'delete', filter: { id } };
      if (scope) body.scope = scope;
      if (scope === 'user') body.sessionToken = getSessionToken();
      const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
        method: 'POST', headers,
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || (typeof result.error === 'string' ? result.error : result.error?.message) || 'Failed to delete item');
      }
      return true;
    } catch (error) {
      console.error('DB delete error:', error);
      throw error;
    }
  }
};`;
}
