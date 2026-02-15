import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, NgIf, RouterOutlet, RouterLink, NgClass],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  user$;
  isSidebarCollapsed = false;
  isAdminExpanded = false;

  constructor(private authService: AuthService, private router: Router) {
    this.user$ = this.authService.currentUser$;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleAdminMenu() {
    if (!this.isSidebarCollapsed) {
      this.isAdminExpanded = !this.isAdminExpanded;
    } else {
      // If sidebar is collapsed, we might want to expand it to show the menu
      // For now, let's just expand the sidebar and the menu
      this.isSidebarCollapsed = false;
      this.isAdminExpanded = true;
    }
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
