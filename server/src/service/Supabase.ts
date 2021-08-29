import { createClient, SupabaseClient } from '@supabase/supabase-js'

export class Supabase {
  private static client: Supabase

  private supabase: SupabaseClient

  private constructor(url: string, key: string) {
    this.supabase = createClient(url, key)
  }

  public static build(): SupabaseClient {
    if (!this.client) {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
        throw new Error('Define SUPABASE_URL and SUPABASE_KEY first')
      }
      this.client = new Supabase(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
    }
    return this.client.supabase
  }
}