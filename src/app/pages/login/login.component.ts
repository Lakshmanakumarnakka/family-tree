import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginCredentials } from '../../services/auth.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';
  showDemoCredentials = false;
  demoUsers: LoginCredentials[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
    
    this.demoUsers = this.authService.getDemoCredentials();
  }

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = result.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred during login';
        console.error('Login error:', error);
      }
    });
  }

  useDemoCredentials(demo: LoginCredentials): void {
    this.credentials = { ...demo };
    this.showDemoCredentials = false;
  }

  toggleDemoCredentials(): void {
    this.showDemoCredentials = !this.showDemoCredentials;
  }
}