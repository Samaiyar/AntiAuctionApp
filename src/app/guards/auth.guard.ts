import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { switchMap, take, map } from 'rxjs';

/**
 * Guard to protect routes that require authentication.
 * Waits for the auth service to finish initializing (restoring session)
 * before checking the user. Redirects to /login if not authenticated.
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.isInitialized$.pipe(
        take(1),
        switchMap(() => authService.currentUser$.pipe(
            take(1),
            map(user => {
                if (user) {
                    return true;
                } else {
                    return router.createUrlTree(['/login']);
                }
            })
        ))
    );
};
