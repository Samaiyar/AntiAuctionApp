import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Player, PlayerService } from '../../../../services/player.service';
import { AuctionService, AuctionCategory } from '../../../../services/auction.service';

@Component({
    selector: 'app-edit-user',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './edit-user.component.html',
    styleUrl: './edit-user.component.css'
})
export class EditUserComponent implements OnInit {
    profileForm: FormGroup;
    imagePreview: string | ArrayBuffer | null = null;
    isSaving = false;
    isLoading = true;
    saveSuccess = false;
    saveError = '';
    playerId = '';

    categories: AuctionCategory[] = [];
    genders: string[] = ['Male', 'Female', 'Other'];

    constructor(
        private fb: FormBuilder,
        private playerService: PlayerService,
        private route: ActivatedRoute,
        private router: Router,
        private auctionService: AuctionService
    ) {
        this.profileForm = this.fb.group({
            name: ['', Validators.required],
            email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
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

        this.playerId = this.route.snapshot.paramMap.get('id') || '';
        if (this.playerId) {
            await this.loadPlayer();
        }
    }

    async loadPlayer() {
        try {
            const player = await this.playerService.getPlayerById(this.playerId);

            // Set image preview if avatar exists
            if (player.avatar_url) {
                this.imagePreview = player.avatar_url;
            }

            // Patch form values
            this.profileForm.patchValue({
                name: player.name,
                email: player.email,
                skills: {
                    batting: player.skills?.includes('Batting') || false,
                    bowling: player.skills?.includes('Bowling') || false,
                    fielding: player.skills?.includes('Fielding') || false
                },
                rating: player.rating,
                gender: player.gender,
                availableOn: {
                    weekdays: player.availability?.includes('Weekdays') || false,
                    weekends: player.availability?.includes('Weekends') || false,
                    evenings: player.availability?.includes('Evenings') || false
                },
                bio: player.bio || ''
            });
        } catch (err: any) {
            console.error('Error loading player:', err);
            this.saveError = 'Failed to load player data.';
        } finally {
            this.isLoading = false;
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
                // Convert checkbox groups to arrays
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

                // Upload new avatar if changed
                let avatarUrl: string | null | undefined = undefined;
                const imageFile = this.profileForm.value.image;
                if (imageFile) {
                    // Use getRawValue to get the disabled email field value
                    avatarUrl = await this.playerService.uploadAvatar(
                        imageFile,
                        this.profileForm.getRawValue().email
                    );
                }

                const updates: Partial<Player> = {
                    name: this.profileForm.value.name,
                    skills,
                    rating: this.profileForm.value.rating,
                    gender: this.profileForm.value.gender,
                    availability,
                    bio: this.profileForm.value.bio || '',
                    base_price: this.categories.find(c => c.name === this.profileForm.value.rating)?.base_price || 0
                };

                // Only include avatar_url if a new image was uploaded
                if (avatarUrl !== undefined) {
                    updates.avatar_url = avatarUrl;
                }

                await this.playerService.updatePlayer(this.playerId, updates);
                this.saveSuccess = true;

                // Navigate back after a short delay
                setTimeout(() => {
                    this.router.navigate(['/dashboard/admin/users']);
                }, 1500);
            } catch (error: any) {
                console.error('Update failed:', error);
                this.saveError = error.message || 'Failed to update profile. Please try again.';
            } finally {
                this.isSaving = false;
            }
        } else {
            this.profileForm.markAllAsTouched();
        }
    }

    goBack(): void {
        this.router.navigate(['/dashboard/admin/users']);
    }
}
