import { Injectable, Injector } from '@angular/core';
import { createClient, SupabaseClient, User, AuthResponse } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  /** Emits true once the initial session has been checked. Guards should wait for this. */
  private initializedSubject = new ReplaySubject<boolean>(1);
  public isInitialized$ = this.initializedSubject.asObservable();

  /** Expose the Supabase client so other services can share the same authenticated session. */
  get client(): SupabaseClient {
    return this.supabase;
  }

  constructor(private injector: Injector) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // Initialize user session
    this.supabase.auth.getUser().then(({ data: { user } }) => {
      this.currentUserSubject.next(user);
      this.initializedSubject.next(true);
    }).catch(() => {
      this.initializedSubject.next(true);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.currentUserSubject.next(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        this.currentUserSubject.next(null);
        const router = this.injector.get(Router);
        router.navigate(['/login']);
      }
    });
  }

  /**
   * Signs up a new user with email and password.
   * @param email User's email address
   * @param password User's password
   * @returns Promise containing the auth response
   */
  async signUp(email: string, password: string): Promise<AuthResponse> {
    const response = await this.supabase.auth.signUp({
      email,
      password,
    });
    if (response.error) throw response.error;
    return response;
  }

  /**
   * Signs in an existing user with email and password.
   * @param email User's email address
   * @param password User's password
   * @returns Promise containing the auth response
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (response.error) throw response.error;
    return response;
  }

  /**
   * Signs out the current user.
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Gets the current user value synchronously.
   * @returns The current User object or null
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
