import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { FamilyTreeService } from './family-tree.service';
import { FamilyMember } from '../models/family-member.model';

export interface FamilyEvent {
  id: string;
  title: string;
  date: string;
  type: 'birthday' | 'anniversary' | 'memorial' | 'reunion' | 'custom';
  description?: string;
  memberId?: string;
  memberName?: string;
  recurring: boolean;
  color?: string;
  location?: string;
  reminder?: boolean;
  reminderDays?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private eventsSubject = new BehaviorSubject<FamilyEvent[]>([]);
  public events$ = this.eventsSubject.asObservable();

  private readonly LOCAL_STORAGE_KEY = 'family-events-data';
  private isBrowser: boolean;
  private events: FamilyEvent[] = [];

  constructor(
    private familyTreeService: FamilyTreeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadEvents();
    
    // Subscribe to family tree changes to update birthday events
    this.familyTreeService.familyTree$.subscribe(familyTree => {
      if (familyTree) {
        this.generateBirthdayEvents(familyTree.members);
      }
    });
  }

  private loadEvents(): void {
    if (this.isBrowser) {
      const savedEvents = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (savedEvents) {
        try {
          this.events = JSON.parse(savedEvents);
          this.eventsSubject.next(this.events);
        } catch (error) {
          console.error('Error loading events:', error);
          this.events = [];
        }
      }
    }
  }

  private saveEvents(): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.events));
        this.eventsSubject.next(this.events);
      } catch (error) {
        console.error('Error saving events:', error);
      }
    }
  }

  private generateBirthdayEvents(members: FamilyMember[]): void {
    // Remove existing birthday events
    this.events = this.events.filter(event => event.type !== 'birthday');

    // Generate birthday events for all family members
    members.forEach(member => {
      if (member.dateOfBirth) {
        const birthdayEvent: FamilyEvent = {
          id: `birthday-${member.id}`,
          title: `🎂 ${member.name}'s Birthday`,
          date: member.dateOfBirth,
          type: 'birthday',
          description: `Birthday celebration for ${member.name}`,
          memberId: member.id,
          memberName: member.name,
          recurring: true,
          color: '#ff6b6b',
          reminder: true,
          reminderDays: 7
        };
        this.events.push(birthdayEvent);
      }
    });

    this.saveEvents();
  }

  getAllEvents(): FamilyEvent[] {
    return [...this.events];
  }

  getEventsByType(type: FamilyEvent['type']): FamilyEvent[] {
    return this.events.filter(event => event.type === type);
  }

  getEventsByMember(memberId: string): FamilyEvent[] {
    return this.events.filter(event => event.memberId === memberId);
  }

  addEvent(event: Omit<FamilyEvent, 'id'>): Observable<boolean> {
    return new Observable(observer => {
      try {
        const newEvent: FamilyEvent = {
          ...event,
          id: Date.now().toString()
        };
        
        this.events.push(newEvent);
        this.saveEvents();
        
        observer.next(true);
        observer.complete();
      } catch (error) {
        console.error('Error adding event:', error);
        observer.next(false);
        observer.complete();
      }
    });
  }

  updateEvent(id: string, updates: Partial<FamilyEvent>): Observable<boolean> {
    return new Observable(observer => {
      try {
        const index = this.events.findIndex(event => event.id === id);
        if (index !== -1) {
          this.events[index] = { ...this.events[index], ...updates };
          this.saveEvents();
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      } catch (error) {
        console.error('Error updating event:', error);
        observer.next(false);
        observer.complete();
      }
    });
  }

  deleteEvent(id: string): Observable<boolean> {
    return new Observable(observer => {
      try {
        const index = this.events.findIndex(event => event.id === id);
        if (index !== -1) {
          this.events.splice(index, 1);
          this.saveEvents();
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      } catch (error) {
        console.error('Error deleting event:', error);
        observer.next(false);
        observer.complete();
      }
    });
  }

  getUpcomingEvents(days: number = 30): FamilyEvent[] {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.events.filter(event => {
      const eventDate = new Date(event.date);
      
      if (event.recurring && event.type === 'birthday') {
        // For recurring birthday events, check this year and next year
        const thisYearDate = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const nextYearDate = new Date(today.getFullYear() + 1, eventDate.getMonth(), eventDate.getDate());
        
        return (thisYearDate >= today && thisYearDate <= futureDate) ||
               (nextYearDate >= today && nextYearDate <= futureDate);
      }
      
      return eventDate >= today && eventDate <= futureDate;
    }).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (a.recurring && a.type === 'birthday') {
        const today = new Date();
        dateA.setFullYear(today.getFullYear());
        if (dateA < today) {
          dateA.setFullYear(today.getFullYear() + 1);
        }
      }
      
      if (b.recurring && b.type === 'birthday') {
        const today = new Date();
        dateB.setFullYear(today.getFullYear());
        if (dateB < today) {
          dateB.setFullYear(today.getFullYear() + 1);
        }
      }
      
      return dateA.getTime() - dateB.getTime();
    });
  }

  // Convert events to FullCalendar format
  getCalendarEvents(): any[] {
    const today = new Date();
    const calendarEvents: any[] = [];

    this.events.forEach(event => {
      if (event.recurring && event.type === 'birthday') {
        // For recurring events, create events for current and next year
        const eventDate = new Date(event.date);
        
        // This year's event
        const thisYearEvent = {
          id: `${event.id}-${today.getFullYear()}`,
          title: event.title,
          start: `${today.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`,
          backgroundColor: event.color || '#3788d8',
          borderColor: event.color || '#3788d8',
          extendedProps: {
            ...event,
            originalDate: event.date
          }
        };
        
        // Next year's event
        const nextYearEvent = {
          id: `${event.id}-${today.getFullYear() + 1}`,
          title: event.title,
          start: `${today.getFullYear() + 1}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`,
          backgroundColor: event.color || '#3788d8',
          borderColor: event.color || '#3788d8',
          extendedProps: {
            ...event,
            originalDate: event.date
          }
        };
        
        calendarEvents.push(thisYearEvent, nextYearEvent);
      } else {
        // Non-recurring events
        calendarEvents.push({
          id: event.id,
          title: event.title,
          start: event.date,
          backgroundColor: event.color || '#3788d8',
          borderColor: event.color || '#3788d8',
          extendedProps: event
        });
      }
    });

    return calendarEvents;
  }

  // Force regenerate birthday events (useful for debugging)
  regenerateBirthdayEvents(): void {
    const familyTree = this.familyTreeService.getFamilyTree();
    if (familyTree && familyTree.members) {
      this.generateBirthdayEvents(familyTree.members);
    }
  }
}