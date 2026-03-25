import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://aupepgdjxsckilkywdzs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cGVwZ2RqeHNja2lsa3l3ZHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDc5NjgsImV4cCI6MjA4OTcyMzk2OH0.UUTHoQ5Dc5MU2Xf02bzK7aYBR_ha-MEtuM8QUFO234M'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export { SUPABASE_URL, SUPABASE_KEY }
