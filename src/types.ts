export interface Message {
  id: string;
  day: number;
  month: number | null;
  year?: number | null;
  message: string;
  message_en?: string | null;
  message_zh?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Greeting {
  id: string;
  type: 'daily' | 'random';
  text: string;
  text_en?: string | null;
  text_zh?: string | null;
  is_active: boolean;
}

export interface MoodMessage {
  id: string;
  mood: string;
  message: string;
  is_active: boolean;
}

export interface MoodHistory {
  id: string;
  device_id: string;
  mood: string;
  message_id: string;
  shown_at: string;
}

export interface UserMessage {
  id: string;
  device_id: string;
  content: string;
  created_at: string;
}

export interface MoodLog {
  id: string;
  mood: string;
  device_id: string;
  created_at: string;
}

export interface Theme {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_gradient: string;
  background_url?: string;
  custom_css?: string;
  custom_html?: string;
  schedule_type: 'always' | 'specific_date' | 'daily_rotation';
  scheduled_date?: string;
  rotation_day?: number;
  is_active: boolean;
  created_at: string;
}

export type MoodType = 'happy' | 'energy' | 'sad' | 'angry';
