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
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('day', day)
      .eq('is_active', true);

    if (error) {
      console.error('Supabase error fetching messages:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    // Filter out messages that don't match the month (unless it's a recurring monthly message)
    const validMessages = data.filter(m => m.month === month || m.month === null);

    // Filter out messages that have a specific year which is not current year
    const messagesForThisYear = validMessages.filter(m => m.year === year || m.year === null || m.year === undefined);

    if (messagesForThisYear.length === 0) return null;

    // Sort to find the best match:
    // 1. Exact year over null year
    // 2. Exact month over null month
    // 3. Newest first (created_at)
    messagesForThisYear.sort((a, b) => {
      if (a.year !== b.year) {
        if (a.year === year) return -1;
        if (b.year === year) return 1;
      }
      if (a.month !== b.month) {
        if (a.month === month) return -1;
        if (b.month === month) return 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return messagesForThisYear[0] as Message;
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

export function getDayCounter() {
  // Gunakan WITA untuk perhitungan yang konsisten
  // Hari Pertama dikunci secara absolut ke 07 April 2026
  const startDate = new Date(2026, 3, 7); // Bulan 3 adalah April (0-indexed)
  
  const now = toZonedTime(new Date(), TIMEZONE);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays + 1 : 1; // Mencegah hasil negatif
}

export async function getGreetingSettings() {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('greetings')
      .select('text')
      .eq('id', '77777777-7777-7777-7777-777777777777')
      .limit(1);

    if (data && data.length > 0) {
      return JSON.parse(data[0].text);
    }
  } catch (err) {}
  
  // Default fallback
  return { isActive: false, days: [0, 1, 2, 3, 4, 5, 6] };
}

export async function saveGreetingSettings(settings: { isActive: boolean, days: number[] }) {
  const supabase = getSupabase();
  await supabase.from('greetings').upsert({
    id: '77777777-7777-7777-7777-777777777777',
    type: 'system' as any,
    text: JSON.stringify(settings),
    is_active: true
  });
}

export function getTimeBasedGreetingKey() {
  const now = toZonedTime(new Date(), TIMEZONE);
  const hour = now.getHours();

  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'noon';
  if (hour >= 15 && hour < 19) return 'afternoon';
  return 'night';
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
