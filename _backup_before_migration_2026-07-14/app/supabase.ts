import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://NJZTXIKJKFJCABRWSLGE.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qenR4aWtqa2ZqY2FicndzbGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTU2OTIsImV4cCI6MjA5NDczMTY5Mn0.8phbP0bpx6Y1dL35Zx4RigvVn2Xh9VE8FMeoEbPTQCY'

export const supabase = createClient(supabaseUrl, supabaseKey)