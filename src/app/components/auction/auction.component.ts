import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuctionService, Team, AuctionCategory } from '../../services/auction.service';
import { PlayerService, Player } from '../../services/player.service';

@Component({
  selector: 'app-auction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.css']
})
export class AuctionComponent implements OnInit, OnDestroy {
  // Data
  players: Player[] = [];
  categories: AuctionCategory[] = [];
  currentIndex: number = 0;
  currentPlayer: Player | null = null;
  teams: any[] = [];

  // Auction State
  currentBid: number = 0;
  basePrice: number = 0;
  timer: number = 10;
  defaultTimer: number = 10;
  timerInterval: any;
  selectedTeamId: string | null = null;
  initialBudget: number = 100000000; // For progress bar calculation
  bidStep: number = 10; // TODO: make config-driven

  // Modal State
  showTeamModal: boolean = false;
  modalTeam: any = null;
  modalPlayers: Player[] = [];

  private pendingPlayerId: string | null = null;
  private queryParamSub!: Subscription;

  constructor(
    public auctionService: AuctionService,
    private playerService: PlayerService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadTeams();
    this.loadPlayers();
    this.loadCategories();

    // Listen for player selection from dashboard search
    this.queryParamSub = this.route.queryParams.subscribe(params => {
      const playerId = params['playerId'];
      if (playerId) {
        this.jumpToPlayer(playerId);
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
    this.queryParamSub?.unsubscribe();
  }

  /**
   * Finds a player by ID and selects them in the auction view.
   */
  jumpToPlayer(playerId: string) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      this.selectPlayer(index);
      this.pendingPlayerId = null;
    } else {
      // Players may not be loaded yet — store for later
      this.pendingPlayerId = playerId;
    }
  }

  async loadTeams() {
    try {
      const teamsData = await this.auctionService.getTeams();
      // For now, calculating players_count locally or fetching if available
      // Assuming backend doesn't return count yet, so we set dummy or 0
      this.teams = teamsData.map(t => ({
        ...t,
        players_count: 0, // TODO: Fetch real count if needed or calculate from players list
        budget: t.budget
      }));
    } catch (error) {
      console.error('Error loading teams', error);
    }
  }

  async loadPlayers() {
    try {
      this.players = await this.playerService.getPlayers();
      if (this.players.length > 0) {
        // If a player was selected before load finished, jump to them
        if (this.pendingPlayerId) {
          this.jumpToPlayer(this.pendingPlayerId);
        } else {
          this.currentIndex = 0;
          this.selectPlayer(this.currentIndex);
        }
      }
    } catch (error) {
      console.error('Error loading players', error);
    }
  }

  selectPlayer(index: number) {
    if (index >= 0 && index < this.players.length) {
      this.currentIndex = index;
      this.currentPlayer = this.players[index];

      this.basePrice = this.currentPlayer.base_price || 200000; // Default base price if missing
      this.currentBid = this.basePrice;

      // If player is already sold, show sold price? 
      // For now, reset to base price for auctioning or sold price if set
      if (this.currentPlayer.team_id) {
        // Maybe disable auction controls?
        this.currentBid = this.currentPlayer.sold_price || this.basePrice;
        this.selectedTeamId = this.currentPlayer.team_id;
      } else {
        this.selectedTeamId = null;
      }

      this.resetTimer();
    }
  }

  async loadCategories() {
    try {
      this.categories = await this.auctionService.getCategories();
    } catch (error) {
      console.error('Error loading categories', error);
    }
  }

  /**
   * Gets the timer for the current player's category, defaulting to 10s.
   */
  getTimerForPlayer(player: Player): number {
    if (!player.rating) return this.defaultTimer;
    const category = this.categories.find(c => c.name === player.rating);
    return category?.timer || this.defaultTimer;
  }

  nextPlayer() {
    if (this.currentIndex < this.players.length - 1) {
      this.selectPlayer(this.currentIndex + 1);
    }
  }

  prevPlayer() {
    if (this.currentIndex > 0) {
      this.selectPlayer(this.currentIndex - 1);
    }
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      }
    }, 1000);
  }

  resetTimer() {
    this.timer = this.currentPlayer ? this.getTimerForPlayer(this.currentPlayer) : this.defaultTimer;
    this.startTimer();
  }

  adjustBid(amount: number) {
    const newBid = this.currentBid + amount;
    if (newBid >= this.basePrice) {
      this.currentBid = newBid;
      this.resetTimer(); // Reset timer on new bid
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getSelectedTeamName(): string {
    const team = this.teams.find(t => t.id === this.selectedTeamId);
    return team ? team.name : '';
  }

  async sellPlayer() {
    if (!this.selectedTeamId || !this.currentPlayer || !this.currentPlayer.id) return;

    // 1. Check budget
    const teamIndex = this.teams.findIndex(t => t.id === this.selectedTeamId);
    if (teamIndex === -1) return;

    const team = this.teams[teamIndex];
    if (team.budget < this.currentBid) {
      alert(`Insufficient budget! ${team.name} only has ${team.budget}`);
      return;
    }

    try {
      // 2. Update Player
      await this.playerService.updatePlayer(this.currentPlayer.id, {
        team_id: this.selectedTeamId,
        sold_price: this.currentBid
      });

      // 3. Update Team Budget
      const newBudget = team.budget - this.currentBid;
      await this.auctionService.updateTeam(team.id, { budget: newBudget });

      // 4. Update UI
      this.teams[teamIndex].budget = newBudget;
      this.teams[teamIndex].players_count += 1; // Increment count
      this.currentPlayer.team_id = this.selectedTeamId;
      this.currentPlayer.sold_price = this.currentBid;

      // alert(`Sold ${this.currentPlayer.name} to ${team.name} for ${this.currentBid}!`);

    } catch (error) {
      console.error("Transaction failed", error);
      alert("Failed to sell player. Check console.");
    }
  }

  async releasePlayer() {
    if (!this.currentPlayer || !this.currentPlayer.id || !this.currentPlayer.team_id) return;

    const soldTeamId = this.currentPlayer.team_id;
    const soldPrice = this.currentPlayer.sold_price || 0;
    const teamIndex = this.teams.findIndex(t => t.id === soldTeamId);
    if (teamIndex === -1) return;

    try {
      // 1. Clear player's team and sold price
      await this.playerService.updatePlayer(this.currentPlayer.id, {
        team_id: null,
        sold_price: undefined
      });

      // 2. Return budget to the team
      const restoredBudget = this.teams[teamIndex].budget + soldPrice;
      await this.auctionService.updateTeam(soldTeamId, { budget: restoredBudget });

      // 3. Update UI
      this.teams[teamIndex].budget = restoredBudget;
      this.teams[teamIndex].players_count = Math.max(0, this.teams[teamIndex].players_count - 1);
      this.currentPlayer.team_id = undefined as any;
      this.currentPlayer.sold_price = undefined;

      // Reset auction state for this player
      this.currentBid = this.currentPlayer.base_price || 200000;
      this.selectedTeamId = null;
      this.resetTimer();

    } catch (error) {
      console.error('Release failed', error);
      alert('Failed to release player. Check console.');
    }
  }

  openTeamModal(team: any) {
    this.modalTeam = team;
    this.modalPlayers = this.players.filter(p => p.team_id === team.id);
    this.showTeamModal = true;
  }

  closeTeamModal() {
    this.showTeamModal = false;
    this.modalTeam = null;
    this.modalPlayers = [];
  }

  getTeamPlayers(teamId: string): Player[] {
    return this.players.filter(p => p.team_id === teamId);
  }
}
