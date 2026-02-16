import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Player {
    id?: string;
    name: string;
    email: string;
    avatar_url?: string | null;
    skills: string[];
    rating: string;
    gender: string;
    availability: string[];
    bio?: string;
    // Auction fields
    team_id?: string | null;
    base_price?: number;
    sold_price?: number;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PlayerService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    /**
     * Creates a new player record in the database.
     */
    async createPlayer(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<Player> {
        // Check if a player with this email already exists
        const { data: existing, error: lookupError } = await this.supabase
            .from('players')
            .select('id')
            .eq('email', player.email)
            .maybeSingle();

        if (lookupError) throw lookupError;

        if (existing) {
            throw new Error('A player with this email already exists. Please use a different email.');
        }

        const { data, error } = await this.supabase
            .from('players')
            .insert(player)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Fetches all players from the database.
     */
    async getPlayers(): Promise<Player[]> {
        const { data, error } = await this.supabase
            .from('players')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Searches players by name using ILIKE (case-insensitive partial match).
     */
    async searchPlayers(query: string): Promise<Player[]> {
        const { data, error } = await this.supabase
            .from('players')
            .select('*')
            .ilike('name', `%${query}%`)
            .order('name', { ascending: true })
            .limit(10);

        if (error) throw error;
        return data || [];
    }

    /**
     * Fetches a single player by ID.
     */
    async getPlayerById(id: string): Promise<Player> {
        const { data, error } = await this.supabase
            .from('players')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Updates an existing player record.
     */
    async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
        const { data, error } = await this.supabase
            .from('players')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Deletes a player record.
     */
    async deletePlayer(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('players')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Uploads an avatar image to Supabase Storage.
     * @param file The image file to upload
     * @param email Player email used to create a unique path
     * @returns The public URL of the uploaded image
     */
    async uploadAvatar(file: File, email: string): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${sanitizedEmail}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await this.supabase.storage
            .from('player-avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data } = this.supabase.storage
            .from('player-avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
}
