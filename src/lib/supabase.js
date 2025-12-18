import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace these placeholders with your real Supabase project values.
// You can find them in Supabase Dashboard -> Project Settings -> API.
const SUPABASE_URL = 'https://uopljsuisvxsvrgfgjph.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvcGxqc3Vpc3Z4c3ZyZ2ZnanBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDkzMDEsImV4cCI6MjA4MTUyNTMwMX0.Mu4fFhBwky7zSNYRrXbv1lclPR5KCZzcBpEzoQp3Gvw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



