import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Handles the login form submission.
   */
  async onSubmit() {
    if (this.loginForm.valid) {
      this.errorMessage = ''; // Clear previous errors
      try {
        const { email, password } = this.loginForm.value;
        await this.authService.signIn(email, password);
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        this.errorMessage = error.message || 'An unexpected error occurred during login.';
      }
    } else {
      this.errorMessage = 'Please fill out all required fields correctly.';
    }
  }
}
