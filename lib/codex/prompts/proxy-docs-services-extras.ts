/**
 * RUX Prompts — Payments, Email, SMS, Maps, and xAI proxy service code generators
 */

export function buildPaymentsServiceCode(): string {
  return `
// Payments (Stripe — web only)
export const payments = {
  createCheckout: async (items: { name: string; price: number; quantity: number }[], successUrl: string, cancelUrl: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/payments\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'createCheckout', items, successUrl, cancelUrl })
    });
    return res.json();
  },
  getProducts: async () => {
    const res = await fetch(\`\${API_BASE}/api/proxy/payments\`, {
      method: 'POST', headers,
      body: JSON.stringify({ operation: 'getProducts' })
    });
    return res.json();
  }
};`;
}

export function buildEmailServiceCode(): string {
  return `
// Email (SendGrid) — send transactional emails
export const email = {
  send: async (to: string | string[], subject: string, options: { html?: string; text?: string; from?: string; replyTo?: string; cc?: string[]; bcc?: string[] } = {}) => {
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/email\`, {
        method: 'POST', headers,
        body: JSON.stringify({ to, subject, ...options })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send email');
      return result;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  },
  notify: async (subject: string, options: { html?: string; text?: string } = {}) => {
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/email\`, {
        method: 'POST', headers,
        body: JSON.stringify({ subject, toOwner: true, ...options })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send notification');
      return result;
    } catch (error) {
      console.error('Email notify error:', error);
      throw error;
    }
  }
};`;
}

export function buildSmsServiceCode(): string {
  return `
// SMS (Twilio) — send text messages
export const sms = {
  send: async (to: string, message: string) => {
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/sms\`, {
        method: 'POST', headers,
        body: JSON.stringify({ to, message })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send SMS');
      return result;
    } catch (error) {
      console.error('SMS send error:', error);
      throw error;
    }
  }
};`;
}

export function buildMapsServiceCode(): string {
  return `
// Maps (Google Maps) — geocoding, directions, places
export const maps = {
  geocode: async (address: string) => {
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'geocode', address })
      });
      return res.json();
    } catch (error) {
      console.error('Maps geocode error:', error);
      throw error;
    }
  },
  directions: async (origin: string, destination: string, mode?: 'driving' | 'walking' | 'bicycling' | 'transit') => {
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'directions', origin, destination, mode })
      });
      return res.json();
    } catch (error) {
      console.error('Maps directions error:', error);
      throw error;
    }
  },
  places: async (query: string, location?: { lat: number; lng: number }, radius?: number) => {
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/maps\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'places', query, location: location ? \`\${location.lat},\${location.lng}\` : undefined, radius })
      });
      return res.json();
    } catch (error) {
      console.error('Maps places error:', error);
      throw error;
    }
  }
};`;
}

export function buildXaiServiceCode(): string {
  return `
// xAI (Grok) — AI chat completions and image generation
export const ai = {
  // Chat with AI
  chat: async (messages: { role: string; content: string }[], options?: { model?: string; temperature?: number; maxTokens?: number; max_tokens?: number }) => {
    try {
      const payload = {
        messages,
        model: options?.model || 'grok-3-fast-beta',
        temperature: options?.temperature,
        max_tokens: options?.maxTokens ?? options?.max_tokens,
      };
      const res = await fetch(\`\${API_BASE}/api/proxy/xai\`, {
        method: 'POST', headers,
        body: JSON.stringify(payload)
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof result?.error === 'string'
            ? result.error
            : result?.error?.message || result?.message || 'AI chat request failed';
        throw new Error(message);
      }
      return result;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  },

  // Generate an image from a text prompt
  // Returns { url, prompt, creditsUsed } — image is automatically saved to project storage
  generateImage: async (prompt: string) => {
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/xai\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'image', prompt })
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof result?.error === 'string'
            ? result.error
            : result?.error?.message || result?.message || 'Image generation failed';
        throw new Error(message);
      }
      return result;
    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    }
  }
};

// Alias for backwards compatibility
export const xai = ai;`;
}
