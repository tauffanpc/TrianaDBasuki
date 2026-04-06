import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { getSupabase } from './supabase';
import { TIMEZONE } from '../constants';
import { Message, Greeting, MoodMessage } from '../types';

export function getCurrentWitaDate(previewDate?: string | null) {
  if (previewDate) {
    return toZonedTime(new Date(previewDate), TIMEZONE);
  }
  return toZonedTime(new Date(), TIMEZONE);
}

export async function getDailyMessage(date: Date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const supabase = getSupabase();

  // Prioritize exact match (day + month)
  const { data: exactMatch } = await supabase
    .from('messages')
    .select('*')
    .eq('day', day)
    .eq('month', month)
    .eq('is_active', true)
    .single();

  if (exactMatch) return exactMatch as Message;

  // Fallback to day only (recurring monthly)
  const { data: dayMatch } = await supabase
    .from('messages')
    .select('*')
    .eq('day', day)
    .is('month', null)
    .eq('is_active', true)
    .single();

  if (dayMatch) return dayMatch as Message;

  return null;
}

export async function getGreeting() {
  const supabase = getSupabase();
  // Try to find a daily greeting first
  const { data: dailyGreeting } = await supabase
    .from('greetings')
    .select('*')
    .eq('type', 'daily')
    .eq('is_active', true)
    .limit(1);

  if (dailyGreeting && dailyGreeting.length > 0) {
    return dailyGreeting[0] as Greeting;
  }

  // Fallback to random greeting
  const { data: randomGreetings } = await supabase
    .from('greetings')
    .select('*')
    .eq('type', 'random')
    .eq('is_active', true);

  if (randomGreetings && randomGreetings.length > 0) {
    const randomIndex = Math.floor(Math.random() * randomGreetings.length);
    return randomGreetings[randomIndex] as Greeting;
  }

  return null;
}

export async function logMood(mood: string, deviceId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('mood_logs').insert({
    mood,
    device_id: deviceId
  });
  if (error) throw error;
}

export async function sendUserMessage(content: string, deviceId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('user_messages').insert({
    content,
    device_id: deviceId
  });
  if (error) throw error;
}

export async function getDailyBackground(date: Date) {
  const supabase = getSupabase();
  const { data: backgrounds } = await supabase
    .from('backgrounds')
    .select('*')
    .eq('is_active', true);

  if (backgrounds && backgrounds.length > 0) {
    // Gunakan modulo tanggal untuk memilih background agar konsisten seharian
    const index = date.getDate() % backgrounds.length;
    return backgrounds[index] as { url: string };
  }
  return null;
}

export function getDayCounter(firstVisitDate: string) {
  const start = new Date(firstVisitDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
