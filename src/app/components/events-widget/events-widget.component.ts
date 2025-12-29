import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventsService, FamilyEvent } from '../../services/events.service';

@Component({
  selector: 'app-events-widget',
  imports: [CommonModule, RouterModule],
  templateUrl: './events-widget.component.html',
  styleUrl: './events-widget.component.scss'
})
export class EventsWidgetComponent implements OnInit, OnDestroy {
  upcomingEvents: FamilyEvent[] = [];
  private subscription = new Subscription();

  constructor(private eventsService: EventsService) {}

  ngOnInit(): void {
    // Subscribe to events changes
    this.subscription.add(
      this.eventsService.events$.subscribe(() => {
        this.loadUpcomingEvents();
      })
    );

    // Load initial events
    this.loadUpcomingEvents();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadUpcomingEvents(): void {
    this.upcomingEvents = this.eventsService.getUpcomingEvents(14); // Next 2 weeks
  }

  formatEventDate(dateStr: string, recurring: boolean = false): string {
    const date = new Date(dateStr);
    
    if (recurring) {
      // For recurring events, show this year's date
      const today = new Date();
      const thisYearDate = new Date(today.getFullYear(), date.getMonth(), date.getDate());
      if (thisYearDate < today) {
        thisYearDate.setFullYear(today.getFullYear() + 1);
      }
      return thisYearDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  }

  getDaysUntilEvent(dateStr: string, recurring: boolean = false): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let eventDate = new Date(dateStr);
    
    if (recurring) {
      // For recurring events, calculate for this year or next year
      eventDate = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      if (eventDate < today) {
        eventDate.setFullYear(today.getFullYear() + 1);
      }
    }
    
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getEventTypeIcon(type: FamilyEvent['type']): string {
    const icons = {
      birthday: '🎂',
      anniversary: '💕',
      memorial: '🕯️',
      reunion: '👨‍👩‍👧‍👦',
      custom: '📅'
    };
    return icons[type] || '📅';
  }
}