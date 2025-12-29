import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  familyId: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Mock users for demo
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'john@smith.com',
      name: 'John Smith',
      role: 'Family Administrator',
      familyId: 'smith-family',
      avatar: 'J'
    },
    {
      id: '2',
      email: 'mary@smith.com',
      name: 'Mary Smith',
      role: 'Family Member',
      familyId: 'smith-family',
      avatar: 'M'
    },
    {
      id: '3',
      email: 'robert@smith.com',
      name: 'Robert Smith',
      role: 'Family Member',
      familyId: 'smith-family',
      avatar: 'R'
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Check for existing session only in browser
    if (isPlatformBrowser(this.platformId)) {
      this.checkExistingSession();
    }
  }

  login(credentials: LoginCredentials): Observable<{ success: boolean; message: string; user?: User }> {
    return new Observable(observer => {
      // Simulate API call delay
      setTimeout(() => {
        const user = this.mockUsers.find(u => u.email === credentials.email);
        
        if (user && credentials.password === 'password123') {
          this.setCurrentUser(user);
          this.saveSession(user);
          observer.next({ 
            success: true, 
            message: 'Login successful', 
            user 
          });
        } else {
          observer.next({ 
            success: false, 
            message: 'Invalid email or password' 
          });
        }
        observer.complete();
      }, 1000);
    });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.clearSession();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private saveSession(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('familyTree_user', JSON.stringify(user));
      localStorage.setItem('familyTree_session', 'active');
    }
  }

  private clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('familyTree_user');
      localStorage.removeItem('familyTree_session');
    }
  }

  private checkExistingSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      const session = localStorage.getItem('familyTree_session');
      const userData = localStorage.getItem('familyTree_user');
      
      if (session === 'active' && userData) {
        try {
          const user = JSON.parse(userData);
          this.setCurrentUser(user);
        } catch (error) {
          this.clearSession();
        }
      }
    }
  }

  // Get demo credentials for testing
  getDemoCredentials(): LoginCredentials[] {
    return [
      { email: 'john@smith.com', password: 'password123' },
      { email: 'mary@smith.com', password: 'password123' },
      { email: 'robert@smith.com', password: 'password123' }
    ];
  }
}