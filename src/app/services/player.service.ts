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
}
