import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kpgjprajrdqzfmcrlyst.supabase.co'
const supabaseKey = 'sb_publishable_eOjMMJ8LLjsrqorOeewKAQ_4qKCxXSK'

export const supabase = createClient(supabaseUrl, supabaseKey)
