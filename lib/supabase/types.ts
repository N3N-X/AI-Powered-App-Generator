// Supabase Database Types
// Auto-generated from schema

export type Plan = 'FREE' | 'PRO' | 'ELITE';
export type Role = 'USER' | 'ADMIN';
export type Platform = 'WEB' | 'IOS' | 'ANDROID';
export type BuildStatus = 'PENDING' | 'QUEUED' | 'BUILDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type BuildPlatform = 'ANDROID' | 'IOS';
export type ProxyService =
  | 'XAI' | 'OPENAI' | 'ANTHROPIC' | 'GOOGLE_AI' | 'GROQ' | 'COHERE' | 'MISTRAL' | 'PERPLEXITY'
  | 'DALL_E' | 'STABLE_DIFFUSION' | 'MIDJOURNEY' | 'FLUX'
  | 'GOOGLE_SEARCH' | 'IMAGE_SEARCH' | 'PLACES' | 'MAPS' | 'SERP'
  | 'TRANSCRIBE' | 'TTS' | 'VIDEO' | 'PDF' | 'OCR'
  | 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP'
  | 'STORAGE' | 'DATABASE' | 'APP_AUTH' | 'ANALYTICS' | 'QR_CODE' | 'WEATHER' | 'TRANSLATE' | 'CURRENCY'
  | 'EMAIL_VALIDATE' | 'PHONE_VALIDATE' | 'DOMAIN_WHOIS'
  | 'PAYMENTS'
  | 'NEWS' | 'STOCKS' | 'CRYPTO' | 'MOVIES' | 'BOOKS' | 'SPORTS';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          plan: Plan;
          role: Role;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          github_token_encrypted: string | null;
          claude_key_encrypted: string | null;
          credits: number;
          total_credits_used: number;
          last_credit_reset: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          plan?: Plan;
          role?: Role;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          github_token_encrypted?: string | null;
          claude_key_encrypted?: string | null;
          credits?: number;
          total_credits_used?: number;
          last_credit_reset?: string | null;
        };
        Update: {
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          plan?: Plan;
          role?: Role;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          github_token_encrypted?: string | null;
          claude_key_encrypted?: string | null;
          credits?: number;
          total_credits_used?: number;
          last_credit_reset?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          slug: string;
          platform: Platform;
          code_files: Record<string, string>;
          chat_history: Array<{role: string; content: string; timestamp: string}>;
          app_config: Record<string, any> | null;
          github_repo: string | null;
          github_url: string | null;
          subdomain: string | null;
          custom_domain: string | null;
          domain_verified: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          slug: string;
          platform?: Platform;
          code_files?: Record<string, string>;
          chat_history?: Array<{role: string; content: string; timestamp: string}>;
          app_config?: Record<string, any> | null;
          github_repo?: string | null;
          github_url?: string | null;
          subdomain?: string | null;
          custom_domain?: string | null;
          domain_verified?: boolean;
          user_id: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          slug?: string;
          platform?: Platform;
          code_files?: Record<string, string>;
          chat_history?: Array<{role: string; content: string; timestamp: string}>;
          app_config?: Record<string, any> | null;
          github_repo?: string | null;
          github_url?: string | null;
          subdomain?: string | null;
          custom_domain?: string | null;
          domain_verified?: boolean;
        };
      };
      prompt_history: {
        Row: {
          id: string;
          prompt: string;
          response: string | null;
          model: string;
          tokens: number | null;
          created_at: string;
          user_id: string;
          project_id: string;
        };
        Insert: {
          id?: string;
          prompt: string;
          response?: string | null;
          model: string;
          tokens?: number | null;
          user_id: string;
          project_id: string;
        };
        Update: {
          response?: string | null;
          tokens?: number | null;
        };
      };
      developer_credentials: {
        Row: {
          id: string;
          platform: string;
          name: string;
          encrypted_data: string;
          metadata: Record<string, any> | null;
          verified: boolean;
          last_verified: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          platform: string;
          name: string;
          encrypted_data: string;
          metadata?: Record<string, any> | null;
          verified?: boolean;
          last_verified?: string | null;
          user_id: string;
        };
        Update: {
          platform?: string;
          name?: string;
          encrypted_data?: string;
          metadata?: Record<string, any> | null;
          verified?: boolean;
          last_verified?: string | null;
        };
      };
      builds: {
        Row: {
          id: string;
          platform: BuildPlatform;
          status: BuildStatus;
          eas_build_id: string | null;
          build_url: string | null;
          artifact_url: string | null;
          build_profile: string;
          version: string | null;
          build_number: number | null;
          logs: string | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
          project_id: string;
        };
        Insert: {
          id?: string;
          platform: BuildPlatform;
          status?: BuildStatus;
          eas_build_id?: string | null;
          build_url?: string | null;
          artifact_url?: string | null;
          build_profile?: string;
          version?: string | null;
          build_number?: number | null;
          logs?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          user_id: string;
          project_id: string;
        };
        Update: {
          status?: BuildStatus;
          eas_build_id?: string | null;
          build_url?: string | null;
          artifact_url?: string | null;
          version?: string | null;
          build_number?: number | null;
          logs?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      project_api_keys: {
        Row: {
          id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          key_encrypted: string | null;
          services: ProxyService[];
          rate_limit: number | null;
          active: boolean;
          last_used_at: string | null;
          created_at: string;
          expires_at: string | null;
          project_id: string;
        };
        Insert: {
          id?: string;
          name?: string;
          key_hash: string;
          key_prefix: string;
          key_encrypted?: string | null;
          services: ProxyService[];
          rate_limit?: number | null;
          active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          project_id: string;
        };
        Update: {
          name?: string;
          services?: ProxyService[];
          rate_limit?: number | null;
          active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
        };
      };
      proxy_usage: {
        Row: {
          id: string;
          service: ProxyService;
          operation: string;
          credits_used: number;
          request_size: number | null;
          response_size: number | null;
          latency_ms: number | null;
          metadata: Record<string, any> | null;
          success: boolean;
          error_code: string | null;
          created_at: string;
          api_key_id: string;
          project_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          service: ProxyService;
          operation: string;
          credits_used: number;
          request_size?: number | null;
          response_size?: number | null;
          latency_ms?: number | null;
          metadata?: Record<string, any> | null;
          success: boolean;
          error_code?: string | null;
          api_key_id: string;
          project_id: string;
          user_id: string;
        };
        Update: never;
      };
      token_purchases: {
        Row: {
          id: string;
          credits: number;
          amount_paid: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          status: string;
          created_at: string;
          refunded_at: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          credits: number;
          amount_paid: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          status?: string;
          refunded_at?: string | null;
          user_id: string;
        };
        Update: {
          status?: string;
          refunded_at?: string | null;
        };
      };
    };
  };
}
