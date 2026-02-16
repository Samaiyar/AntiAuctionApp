import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            { path: 'auction', loadComponent: () => import('./components/auction/auction.component').then(m => m.AuctionComponent) },
            { path: 'admin', loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent) },
            { path: 'admin/users', loadComponent: () => import('./components/admin/user-admin/user-admin.component').then(m => m.UserAdminComponent) },
            { path: 'admin/users/edit/:id', loadComponent: () => import('./components/admin/user-admin/edit-user/edit-user.component').then(m => m.EditUserComponent) },
            { path: 'admin/auctions', loadComponent: () => import('./components/admin/auction-admin/auction-admin.component').then(m => m.AuctionAdminComponent) },
            { path: '', redirectTo: 'auction', pathMatch: 'full' }
        ]
    },
    { path: 'profile', loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent) },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];
