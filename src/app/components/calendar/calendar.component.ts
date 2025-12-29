import { Component, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Subscription } from 'rxjs';
import { EventsService, FamilyEvent } from '../../services/events.service';
import { EventFormComponent } from '../event-form/event-form.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-calendar',
  imports: [CommonModule, RouterModule, FullCalendarModule, EventFormComponent, HeaderComponent, FooterComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit, OnDestroy {
  calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin, interactionPlugin, listPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,listWeek'
    },
    initialView: 'dayGridMonth',
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    height: 'auto',
    events: []
  });

  currentEvents = signal<any[]>([]);
  showEventForm = false;
  selectedDate: string | null = null;
  selectedEvent: FamilyEvent | null = null;
  upcomingEvents: FamilyEvent[] = [];
  eventsSidebarCollapsed = false;

  private subscription = new Subscription();

  constructor(private eventsService: EventsService) {}

  ngOnInit(): void {
    // Subscribe to events changes
    this.subscription.add(
      this.eventsService.events$.subscribe(events => {
        const calendarEvents = this.eventsService.getCalendarEvents();
        this.calendarOptions.update(options => ({
          ...options,
          events: calendarEvents
        }));
        this.updateUpcomingEvents();
      })
    );

    // Load initial events
    this.updateUpcomingEvents();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  handleDateSelect(selectInfo: DateSelectArg): void {
    this.selectedDate = selectInfo.startStr;
    this.selectedEvent = null;
    this.showEventForm = true;
  }

  handleEventClick(clickInfo: EventClickArg): void {
    const eventData = clickInfo.event.extendedProps as FamilyEvent;
    this.selectedEvent = eventData;
    this.selectedDate = null;
    this.showEventForm = true;
  }

  handleEvents(events: any[]): void {
    this.currentEvents.set(events);
  }

  onEventAdded(event: FamilyEvent): void {
    this.showEventForm = false;
    this.selectedDate = null;
    this.updateUpcomingEvents();
  }

  onEventUpdated(event: FamilyEvent): void {
    this.showEventForm = false;
    this.selectedEvent = null;
    this.updateUpcomingEvents();
  }

  onEventDeleted(): void {
    this.showEventForm = false;
    this.selectedEvent = null;
    this.updateUpcomingEvents();
  }

  onFormClosed(): void {
    this.showEventForm = false;
    this.selectedDate = null;
    this.selectedEvent = null;
  }

  private updateUpcomingEvents(): void {
    this.upcomingEvents = this.eventsService.getUpcomingEvents(30);
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
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
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

  toggleEventsSidebar(): void {
    this.eventsSidebarCollapsed = !this.eventsSidebarCollapsed;
  }

  regenerateEvents(): void {
    this.eventsService.regenerateBirthdayEvents();
    this.updateUpcomingEvents();
  }
}