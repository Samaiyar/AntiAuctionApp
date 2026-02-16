import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';

export interface AuctionCategory {
  id?: string;
  name: string;
  base_price: number;
  timer?: number; // Auction timer in seconds per category
  created_at?: string;
}

export interface Team {
  id?: string;
  name: string;
  captain?: string;
  budget: number;
  logo_url?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  private supabase: SupabaseClient;
  private static AUCTION_LIVE_KEY = 'auction_is_live';

  /** Shared auction live state — persisted in localStorage */
  get isAuctionLive(): boolean {
    return localStorage.getItem(AuctionService.AUCTION_LIVE_KEY) === 'true';
  }
  set isAuctionLive(value: boolean) {
    localStorage.setItem(AuctionService.AUCTION_LIVE_KEY, String(value));
  }

  constructor(private authService: AuthService) {
    this.supabase = this.authService.client;
  }

  // Categories
  async getCategories(): Promise<AuctionCategory[]> {
    const { data, error } = await this.supabase
      .from('auction_categories')
      .select('*')
      .order('base_price', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createCategory(category: AuctionCategory): Promise<AuctionCategory> {
    const { data, error } = await this.supabase
      .from('auction_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('auction_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async uploadTeamLogo(file: File, teamName: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `team_${teamName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
    const filePath = `team-logos/${fileName}`;

    const { error: uploadError } = await this.supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async createTeam(team: Team): Promise<Team> {
    const { data, error } = await this.supabase
      .from('teams')
      .insert(team)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const { data, error } = await this.supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTeam(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
