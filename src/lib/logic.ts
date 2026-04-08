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
  const year = date.getFullYear();
  const supabase = getSupabase();

  try {
    // 1. Prioritize exact match (day + month + year)
    const { data: exactYearMatch } = await supabase
      .from('messages')
      .select('*')
      .eq('day', day)
      .eq('month', month)
      .eq('year', year)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (exactYearMatch) return exactYearMatch as Message;

    // 2. Prioritize exact match without year (day + month, year = null)
    const { data: exactMatch } = await supabase
      .from('messages')
      .select('*')
      .eq('day', day)
      .eq('month', month)
      .is('year', null)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (exactMatch) return exactMatch as Message;

    // 3. Fallback to recurring monthly (day only, month = null, year = null)
    const { data: dayMatch } = await supabase
      .from('messages')
      .select('*')
      .eq('day', day)
      .is('month', null)
      .is('year', null)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dayMatch) return dayMatch as Message;
  } catch (err) {
    console.error('Error fetching daily message:', err);
  }

  return null;
}

export async function getGreeting() {
  const supabase = getSupabase();
  const { data: dailyGreeting } = await supabase
    .from('greetings')
    .select('*')
    .eq('type', 'daily')
    .eq('is_active', true)
    .limit(1);

  if (dailyGreeting && dailyGreeting.length > 0) {
    return dailyGreeting[0] as Greeting;
  }

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
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('mood_messages').insert({
      mood,
      device_id: deviceId
    });
    if (error) console.error('Failed to log mood:', error.message);
  } catch (err) {
    console.error('Mood logging exception:', err);
  }
}

export async function sendUserMessage(content: string, deviceId: string) {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('user_messages').insert({
      content,
      device_id: deviceId
    });
    if (error) console.error('Failed to send user message:', error.message);
  } catch (err) {
    console.error('User message exception:', err);
  }
}

export async function getDailyBackground(date: Date) {
  const supabase = getSupabase();
  const { data: backgrounds } = await supabase
    .from('backgrounds')
    .select('*')
    .eq('is_active', true);

  if (backgrounds && backgrounds.length > 0) {
    const index = date.getDate() % backgrounds.length;
    return backgrounds[index] as { url: string };
  }
  return null;
}

export function getDayCounter(firstVisitDate: string) {
  // Gunakan WITA untuk perhitungan yang konsisten
  const start = toZonedTime(new Date(firstVisitDate), TIMEZONE);
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  
  const now = toZonedTime(new Date(), TIMEZONE);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export async function getUserDiaryArchive(deviceId: string) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_messages')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to get user diary archive:', err);
    return [];
  }
}
