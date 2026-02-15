import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  profileForm: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  isSaving = false;
  saveSuccess = false;
  saveError = '';

  ratings: string[] = ['A+', 'A', 'B', 'C'];
  genders: string[] = ['Male', 'Female', 'Other'];

  constructor(
    private fb: FormBuilder,
    private playerService: PlayerService
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

        const playerData = {
          name: this.profileForm.value.name,
          email: this.profileForm.value.email,
          avatar_url: null, // TODO: Upload image to Supabase Storage
          skills,
          rating: this.profileForm.value.rating,
          gender: this.profileForm.value.gender,
          availability,
          bio: this.profileForm.value.bio || ''
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
