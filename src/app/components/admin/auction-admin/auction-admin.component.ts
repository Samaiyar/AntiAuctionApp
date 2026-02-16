import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuctionService, AuctionCategory, Team } from '../../../services/auction.service';

@Component({
  selector: 'app-auction-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auction-admin.component.html',
  styleUrl: './auction-admin.component.css'
})
export class AuctionAdminComponent implements OnInit {
  categories: AuctionCategory[] = [];
  teams: Team[] = [];

  categoryForm: FormGroup;
  teamForm: FormGroup;

  isSubmitting = false;
  showTeamModal = false;
  logoPreview: string | null = null;
  logoFile: File | null = null;

  constructor(
    private auctionService: AuctionService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      base_price: ['', [Validators.required, Validators.min(0)]],
      timer: [10, [Validators.min(1)]]
    });

    this.teamForm = this.fb.group({
      name: ['', Validators.required],
      captain: [''],
      budget: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTeams();
  }

  // Categories
  async loadCategories() {
    try {
      this.categories = await this.auctionService.getCategories();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async addCategory() {
    if (this.categoryForm.invalid) return;

    this.isSubmitting = true;
    try {
      await this.auctionService.createCategory(this.categoryForm.value);
      await this.loadCategories();
      this.categoryForm.reset();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await this.auctionService.deleteCategory(id);
      await this.loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category.');
    }
  }

  // Teams
  async loadTeams() {
    try {
      this.teams = await this.auctionService.getTeams();
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }

  openAddTeamModal() {
    this.showTeamModal = true;
    this.logoPreview = null;
    this.logoFile = null;
  }

  closeAddTeamModal() {
    this.showTeamModal = false;
    this.teamForm.reset();
    this.logoPreview = null;
    this.logoFile = null;
  }

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.logoFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async addTeam() {
    if (this.teamForm.invalid) return;

    this.isSubmitting = true;
    try {
      let logoUrl: string | undefined;

      // Upload logo if provided
      if (this.logoFile) {
        logoUrl = await this.auctionService.uploadTeamLogo(
          this.logoFile,
          this.teamForm.value.name
        );
      }

      const teamData: Partial<Team> = {
        name: this.teamForm.value.name,
        captain: this.teamForm.value.captain || undefined,
        budget: this.teamForm.value.budget
      };

      if (logoUrl) {
        teamData.logo_url = logoUrl;
      }

      await this.auctionService.createTeam(teamData as Team);
      await this.loadTeams();
      this.closeAddTeamModal();
    } catch (error) {
      console.error('Error adding team:', error);
      alert('Failed to add team. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteTeam(id: string) {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      await this.auctionService.deleteTeam(id);
      await this.loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team.');
    }
  }
}
