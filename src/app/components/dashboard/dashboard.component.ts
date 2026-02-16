import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AuctionService } from '../../services/auction.service';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgClass, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerService, Player } from '../../services/player.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, RouterOutlet, RouterLink, RouterLinkActive, NgClass, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  user$;
  isSidebarCollapsed = false;
  isAdminExpanded = false;

  // Auction search (delegates to shared service)
  get isAuctionLive(): boolean { return this.auctionService.isAuctionLive; }
  set isAuctionLive(val: boolean) { this.auctionService.isAuctionLive = val; }
  searchQuery = '';
  searchResults: Player[] = [];
  showResults = false;
  private searchTimeout: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private playerService: PlayerService,
    private auctionService: AuctionService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleAdminMenu() {
    if (!this.isSidebarCollapsed) {
      this.isAdminExpanded = !this.isAdminExpanded;
    } else {
      this.isSidebarCollapsed = false;
      this.isAdminExpanded = true;
    }
  }

  toggleAuction() {
    this.isAuctionLive = !this.isAuctionLive;
    if (!this.isAuctionLive) {
      this.clearSearch();
    }
  }

  onSearchInput() {
    clearTimeout(this.searchTimeout);

    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      this.showResults = false;
      return;
    }

    // Debounce 300ms
    this.searchTimeout = setTimeout(async () => {
      try {
        this.searchResults = await this.playerService.searchPlayers(this.searchQuery.trim());
        this.showResults = this.searchResults.length > 0;
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  }

  selectPlayer(player: Player) {
    this.showResults = false;
    this.searchQuery = player.name;
    // Navigate to auction view with selected player
    this.router.navigate(['/dashboard/auction'], { queryParams: { playerId: player.id } });
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false;
  }

  closeResults() {
    // Small delay so click on result fires first
    setTimeout(() => {
      this.showResults = false;
    }, 200);
  }

  /**
   * Logs out the current user and redirects to login page.
   */
  async logout() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}
