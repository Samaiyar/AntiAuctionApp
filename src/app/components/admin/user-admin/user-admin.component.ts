import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Player, PlayerService } from '../../../services/player.service';

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-admin.component.html',
  styleUrl: './user-admin.component.css'
})
export class UserAdminComponent implements OnInit {
  players: Player[] = [];
  filteredPlayers: Player[] = [];
  isLoading = true;
  error = '';
  searchTerm = '';

  constructor(private playerService: PlayerService, private router: Router) { }

  async ngOnInit() {
    await this.loadPlayers();
  }

  async loadPlayers() {
    this.isLoading = true;
    try {
      this.players = await this.playerService.getPlayers();
      this.filterPlayers();
    } catch (err: any) {
      console.error('Error fetching players:', err);
      this.error = 'Failed to load players.';
    } finally {
      this.isLoading = false;
    }
  }

  filterPlayers() {
    if (!this.searchTerm) {
      this.filteredPlayers = this.players;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredPlayers = this.players.filter(player =>
      player.name.toLowerCase().includes(term) ||
      player.email.toLowerCase().includes(term)
    );
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterPlayers();
  }

  async deletePlayer(id: string) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await this.playerService.deletePlayer(id);
        this.players = this.players.filter(p => p.id !== id);
        this.filterPlayers();
      } catch (err: any) {
        console.error('Error deleting player:', err);
        alert('Failed to delete user. Please try again.');
      }
    }
  }

  editPlayer(player: Player) {
    this.router.navigate(['/dashboard/admin/users/edit', player.id]);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
