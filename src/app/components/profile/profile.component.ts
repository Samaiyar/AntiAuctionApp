import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../services/player.service';
import { AuctionService, AuctionCategory } from '../../services/auction.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  isSaving = false;
  saveSuccess = false;
  saveError = '';

  categories: AuctionCategory[] = [];
  genders: string[] = ['Male', 'Female', 'Other'];

  constructor(
    private fb: FormBuilder,
    private playerService: PlayerService,
    private auctionService: AuctionService
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      image: [null],
      skills: this.fb.group({
        batting: [false],
        bowling: [false],
        fielding: [false]
      }),
      rating: ['', Validators.required],
      gender: ['', Validators.required],
      availableOn: this.fb.group({
        weekdays: [false],
        weekends: [false],
        evenings: [false]
      }),
      bio: ['', [Validators.maxLength(500)]]
    });
  }

  async ngOnInit() {
    try {
      this.categories = await this.auctionService.getCategories();
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.profileForm.patchValue({ image: file });
      this.profileForm.get('image')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.valid) {
      this.isSaving = true;
      this.saveSuccess = false;
      this.saveError = '';

      try {
        // Convert checkbox groups to arrays for the DB
        const skillsGroup = this.profileForm.value.skills;
        const skills: string[] = [];
        if (skillsGroup.batting) skills.push('Batting');
        if (skillsGroup.bowling) skills.push('Bowling');
        if (skillsGroup.fielding) skills.push('Fielding');

        const availGroup = this.profileForm.value.availableOn;
        const availability: string[] = [];
        if (availGroup.weekdays) availability.push('Weekdays');
        if (availGroup.weekends) availability.push('Weekends');
        if (availGroup.evenings) availability.push('Evenings');

        // Upload avatar image if one was selected
        let avatarUrl: string | null = null;
        const imageFile = this.profileForm.value.image;
        if (imageFile) {
          avatarUrl = await this.playerService.uploadAvatar(
            imageFile,
            this.profileForm.value.email
          );
        }

        const playerData = {
          name: this.profileForm.value.name,
          email: this.profileForm.value.email,
          avatar_url: avatarUrl,
          skills,
          rating: this.profileForm.value.rating,
          gender: this.profileForm.value.gender,
          availability,
          bio: this.profileForm.value.bio || '',
          base_price: this.categories.find(c => c.name === this.profileForm.value.rating)?.base_price || 0
        };

        const result = await this.playerService.createPlayer(playerData);
        console.log('Player saved:', result);
        this.saveSuccess = true;
        this.profileForm.reset();
        this.imagePreview = null;
      } catch (error: any) {
        console.error('Save failed:', error);
        this.saveError = error.message || 'Failed to save profile. Please try again.';
      } finally {
        this.isSaving = false;
      }
    } else {
      this.profileForm.markAllAsTouched();
    }
  }
}
