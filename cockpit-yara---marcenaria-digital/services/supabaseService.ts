
import { createClient } from '@supabase/supabase-js';
import type { UserProfile, ProjectHistoryItem } from '../types';

const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
    : null;

export const syncProfileToCloud = async (profile: UserProfile) => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('profiles')
            .upsert({ 
                id: profile.id,
                email: profile.email.toLowerCase().trim(),
                full_name: profile.fullName,
                business_name: profile.businessName,
                role: profile.role,
                credits: profile.credits,
                onboarding_completed: profile.onboardingCompleted,
                data: profile 
            }, { onConflict: 'email' });
        
        if (error) return null;
        return data;
    } catch (e) {
        return null;
    }
};

export const fetchProfileFromCloud = async (email: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('data')
            .eq('email', email.toLowerCase().trim())
            .single();
        
        if (error) return null;
        return data?.data as UserProfile;
    } catch (e) {
        return null;
    }
};

export const syncProjectToCloud = async (project: ProjectHistoryItem, userEmail: string) => {
    if (!supabase) return null;
    try {
        await supabase.from('projects').upsert({
            id: project.id,
            owner_email: userEmail.toLowerCase().trim(),
            name: project.name,
            data: project
        });
    } catch (e) {}
};

export const fetchProjectsFromCloud = async (userEmail: string): Promise<ProjectHistoryItem[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('data')
            .eq('owner_email', userEmail.toLowerCase().trim())
            .order('id', { ascending: false });
        
        if (error) return [];
        return (data || []).map(d => d.data as ProjectHistoryItem);
    } catch (e) {
        return [];
    }
};

export const deleteProjectFromCloud = async (projectId: string) => {
    if (!supabase) return;
    try {
        await supabase.from('projects').delete().eq('id', projectId);
    } catch (e) {}
};
