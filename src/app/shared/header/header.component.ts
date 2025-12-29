import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private subscription = new Subscription();

  navigationItems = [
    { label: 'Family Tree', icon: '🌳', active: true, route: '/dashboard' },
    { label: 'Members', icon: '👥', active: false, route: '/dashboard' },
    { label: 'Events', icon: '📅', active: false, route: '/calendar' },
    { label: 'Gallery', icon: '📸', active: false, route: '/dashboard' }
  ];

  showUserDropdown = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onProfileClick(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  onNotificationClick(): void {
    console.log('Notifications clicked');
  }

  addMember(): void {
    // Emit custom event to show add member form
    const event = new CustomEvent('showAddMemberForm');
    window.dispatchEvent(event);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.showUserDropdown = false;
  }

  viewProfile(): void {
    console.log('View profile clicked');
    this.showUserDropdown = false;
  }

  settings(): void {
    console.log('Settings clicked');
    this.showUserDropdown = false;
  }

  onNavItemClick(item: any): void {
    // Update active state
    this.navigationItems.forEach(navItem => navItem.active = false);
    item.active = true;
  }
}
