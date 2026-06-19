import {createClient} from "@supabase/supabase-js"
import {auth} from "@clerk/nextjs/server"

export const createSupabaseClient = () => {
    // Check if environment variables are defined
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables");
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables");
    }
    
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            async accessToken() {
                return( (await auth()).getToken());
            }
        }
    )
}