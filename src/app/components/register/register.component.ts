import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Handles the registration form submission.
   */
  async onSubmit() {
    if (this.registerForm.valid) {
      this.errorMessage = '';
      try {
        const { email, password } = this.registerForm.value;
        await this.authService.signUp(email, password);
        alert('Registration successful! Please check your email for verification.');
        this.router.navigate(['/login']);
      } catch (error: any) {
        this.errorMessage = error.message || 'An unexpected error occurred during registration.';
      }
    } else {
      this.errorMessage = 'Please fill out all required fields correctly.';
    }
  }
}
