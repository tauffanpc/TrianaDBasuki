# Supabase SQL Schema

Run these commands in your Supabase SQL Editor to set up the database:

```sql
-- Messages Table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day INTEGER NOT NULL,
  month INTEGER,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Greetings Table
CREATE TABLE greetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('daily', 'random')),
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Mood Messages Table
CREATE TABLE mood_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mood TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Mood History Table
CREATE TABLE mood_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  mood TEXT NOT NULL,
  message_id UUID REFERENCES mood_messages(id) ON DELETE CASCADE,
  shown_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE greetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_history ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow public read for now, but restrict writes)
CREATE POLICY "Public Read Messages" ON messages FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Greetings" ON greetings FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Mood Messages" ON mood_messages FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Mood History" ON mood_history FOR SELECT USING (true);
CREATE POLICY "Public Insert Mood History" ON mood_history FOR INSERT WITH CHECK (true);

-- Admin Policies (You should restrict these to authenticated admins in production)
-- For this demo, we use a custom admin login, but for real security, use Supabase Auth.
CREATE POLICY "Admin All Messages" ON messages FOR ALL USING (true);
CREATE POLICY "Admin All Greetings" ON greetings FOR ALL USING (true);
CREATE POLICY "Admin All Mood Messages" ON mood_messages FOR ALL USING (true);
CREATE POLICY "Admin All Mood History" ON mood_history FOR ALL USING (true);
```
