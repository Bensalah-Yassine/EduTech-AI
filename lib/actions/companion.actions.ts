'use server';

import {auth} from "@clerk/nextjs/server";
import {createSupabaseClient} from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export const createCompanion = async (formData: CreateCompanion) => {
    const { userId: author } = await auth();
    if (!author) throw new Error('Authentication required');
    
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
        .from('companions')
        .insert({...formData, author })
        .select();

    if(error || !data) throw new Error(error?.message || 'Failed to create a companion');

    return data[0];
}

export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic }: GetAllCompanions) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Authentication required');
    
    const supabase = createSupabaseClient();

    let query = supabase.from('companions').select();

    // Only show companions created by the current user
    query = query.eq('author', userId);

    if(subject && topic) {
        query = query.ilike('subject', `%${subject}%`)
            .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
    } else if(subject) {
        query = query.ilike('subject', `%${subject}%`)
    } else if(topic) {
        query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
    }

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: companions, error } = await query;

    if(error) throw new Error(error.message);

    return companions;
}

export const getCompanion = async (id: string) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Authentication required');
    
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('id', id)
        .eq('author', userId); // Only allow access to companions created by the current user

    if(error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Companion not found or access denied');

    return data[0];
}

export const addToSessionHistory = async (companionId: string) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Authentication required');
    
    const supabase = createSupabaseClient();
    
    // Verify the companion belongs to the current user before adding to session history
    const { data: companionCheck, error: companionError } = await supabase
        .from('companions')
        .select('id')
        .eq('id', companionId)
        .eq('author', userId)
        .single();
        
    if (companionError || !companionCheck) {
        throw new Error('Companion not found or access denied');
    }
    
    const { data, error } = await supabase.from('session_history')
        .insert({
            companion_id: companionId,
            user_id: userId,
        })

    if(error) throw new Error(error.message);

    return data;
}

export const getRecentSessions = async (limit = 10) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Authentication required');
    
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('session_history')
        .select(`companions:companion_id (*)`)
        .eq('user_id', userId) // Only get sessions for the current user
        .order('created_at', { ascending: false })
        .limit(limit)

    if(error) throw new Error(error.message);

    return data.map(({ companions }) => companions);
}

export const getUserSessions = async (userId: string, limit = 10) => {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) throw new Error('Authentication required');
    
    // Ensure users can only access their own sessions
    if (currentUserId !== userId) {
        throw new Error('Access denied');
    }
    
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('session_history')
        .select(`companions:companion_id (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if(error) throw new Error(error.message);

    return data.map(({ companions }) => companions);
}

export const getUserCompanions = async (userId: string) => {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) throw new Error('Authentication required');
    
    // Ensure users can only access their own companions
    if (currentUserId !== userId) {
        throw new Error('Access denied');
    }
    
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('author', userId)

    if(error) throw new Error(error.message);

    return data;
}
/*
export const newCompanionPermissions = async () => {
    const { userId, has } = await auth();
    const supabase = createSupabaseClient();

    let limit = 0;

    if(has({ plan: 'pro' })) {
        return true;
    } else if(has({ feature: "3_companion_limit" })) {
        limit = 3;
    } else if(has({ feature: "10_companion_limit" })) {
        limit = 10;
    }

    const { data, error } = await supabase
        .from('companions')
        .select('id', { count: 'exact' })
        .eq('author', userId)

    if(error) throw new Error(error.message);

    const companionCount = data?.length;

    if(companionCount >= limit) {
        return false
    } else {
        return true;
    }
}
*/
// Bookmarks
export const addBookmark = async (companionId: string, path: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');
  
  const supabase = createSupabaseClient();
  
  // Verify the companion belongs to the current user before bookmarking
  const { data: companionCheck, error: companionError } = await supabase
      .from('companions')
      .select('id')
      .eq('id', companionId)
      .eq('author', userId)
      .single();
      
  if (companionError || !companionCheck) {
      throw new Error('Companion not found or access denied');
  }
  
  const { data, error } = await supabase.from("bookmarks").insert({
    companion_id: companionId,
    user_id: userId,
  });
  if (error) {
    throw new Error(error.message);
  }
  // Revalidate the path to force a re-render of the page

  revalidatePath(path);
  return data;
};

export const removeBookmark = async (companionId: string, path: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("companion_id", companionId)
    .eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath(path);
  return data;
};

// It's almost the same as getUserCompanions, but it's for the bookmarked companions
export const getBookmarkedCompanions = async (userId: string) => {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error('Authentication required');
  
  // Ensure users can only access their own bookmarks
  if (currentUserId !== userId) {
      throw new Error('Access denied');
  }
  
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select(`companions:companion_id(*)`) // Notice the (*) to get all the companion data
    .eq("user_id", userId);
    
  if (error) {
    throw new Error(error.message);
  }
  
  // We don't need the bookmarks data, so we return only the companions
  return data.map(({ companions }) => companions);
};