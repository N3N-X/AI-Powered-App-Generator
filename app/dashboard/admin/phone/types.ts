export interface VoiceSettings {
  id: string;
  enabled: boolean;
  greeting_message: string;
  pro_greeting_message: string;
  forwarding_number: string;
  system_prompt: string;
  max_conversation_turns: number;
  sms_enabled: boolean;
  sms_auto_reply: boolean;
  sms_system_prompt: string;
}

export interface CallLog {
  id: string;
  call_sid: string;
  caller_number: string;
  user_id: string | null;
  user_plan: string | null;
  status: string;
  forwarded: boolean;
  direction: string;
  duration_seconds: number | null;
  conversation: { role: "caller" | "agent"; text: string }[];
  outcome: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface CallStats {
  totalCalls: number;
  forwardedCalls: number;
  callsToday: number;
  avgDuration: number;
}

export interface MessageLog {
  id: string;
  message_sid: string | null;
  direction: string;
  from_number: string;
  to_number: string;
  body: string;
  user_id: string | null;
  user_plan: string | null;
  ai_response: string | null;
  status: string;
  created_at: string;
}

export interface MessageStats {
  totalMessages: number;
  incoming: number;
  outgoing: number;
  messagesToday: number;
}
