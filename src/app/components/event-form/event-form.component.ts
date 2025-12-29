import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventsService, FamilyEvent } from '../../services/events.service';
import { FamilyTreeService } from '../../services/family-tree.service';
import { FamilyMember } from '../../models/family-member.model';

@Component({
  selector: 'app-event-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.scss'
})
export class EventFormComponent implements OnInit {
  @Input() selectedDate: string | null = null;
  @Input() selectedEvent: FamilyEvent | null = null;
  @Output() eventAdded = new EventEmitter<FamilyEvent>();
  @Output() eventUpdated = new EventEmitter<FamilyEvent>();
  @Output() eventDeleted = new EventEmitter<void>();
  @Output() formClosed = new EventEmitter<void>();

  eventData: Partial<FamilyEvent> = {
    title: '',
    date: '',
    type: 'custom',
    description: '',
    memberId: '',
    recurring: false,
    color: '#3498db',
    location: '',
    reminder: true,
    reminderDays: 7
  };

  eventTypes = [
    { value: 'birthday', label: '🎂 Birthday', color: '#ff6b6b' },
    { value: 'anniversary', label: '💕 Anniversary', color: '#ff69b4' },
    { value: 'memorial', label: '🕯️ Memorial', color: '#95a5a6' },
    { value: 'reunion', label: '👨‍👩‍👧‍👦 Family Reunion', color: '#f39c12' },
    { value: 'custom', label: '📅 Custom Event', color: '#3498db' }
  ];

  familyMembers: FamilyMember[] = [];
  isSubmitting = false;
  isDeleting = false;
  errorMessage = '';
  successMessage = '';
  isEditMode = false;

  constructor(
    private eventsService: EventsService,
    private familyTreeService: FamilyTreeService
  ) {}

  ngOnInit(): void {
    this.familyMembers = this.familyTreeService.getAllMembers();
    
    if (this.selectedEvent) {
      // Edit mode
      this.isEditMode = true;
      this.eventData = { ...this.selectedEvent };
    } else if (this.selectedDate) {
      // Add mode with pre-selected date
      this.eventData.date = this.selectedDate;
    } else {
      // Add mode without date
      this.eventData.date = new Date().toISOString().split('T')[0];
    }

    // Set color based on type
    this.onTypeChange();
  }

  onTypeChange(): void {
    const selectedType = this.eventTypes.find(type => type.value === this.eventData.type);
    if (selectedType) {
      this.eventData.color = selectedType.color;
    }

    // Auto-set recurring for birthdays
    if (this.eventData.type === 'birthday') {
      this.eventData.recurring = true;
    }
  }

  onMemberChange(): void {
    if (this.eventData.memberId) {
      const member = this.familyMembers.find(m => m.id === this.eventData.memberId);
      if (member) {
        this.eventData.memberName = member.name;
        
        // Auto-fill for birthday events
        if (this.eventData.type === 'birthday' && member.dateOfBirth) {
          this.eventData.date = member.dateOfBirth;
          this.eventData.title = `🎂 ${member.name}'s Birthday`;
          this.eventData.description = `Birthday celebration for ${member.name}`;
        }
      }
    }
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode && this.selectedEvent) {
      // Update existing event
      this.eventsService.updateEvent(this.selectedEvent.id, this.eventData).subscribe({
        next: (success) => {
          this.isSubmitting = false;
          if (success) {
            this.successMessage = 'Event updated successfully!';
            this.eventUpdated.emit({ ...this.selectedEvent, ...this.eventData } as FamilyEvent);
            setTimeout(() => this.closeForm(), 1500);
          } else {
            this.errorMessage = 'Failed to update event. Please try again.';
          }
        },
        error: (error) => {
          console.error('Update event error:', error);
          this.isSubmitting = false;
          this.errorMessage = 'An error occurred while updating the event.';
        }
      });
    } else {
      // Add new event
      this.eventsService.addEvent(this.eventData as Omit<FamilyEvent, 'id'>).subscribe({
        next: (success) => {
          this.isSubmitting = false;
          if (success) {
            this.successMessage = 'Event added successfully!';
            this.eventAdded.emit(this.eventData as FamilyEvent);
            setTimeout(() => this.closeForm(), 1500);
          } else {
            this.errorMessage = 'Failed to add event. Please try again.';
          }
        },
        error: (error) => {
          console.error('Add event error:', error);
          this.isSubmitting = false;
          this.errorMessage = 'An error occurred while adding the event.';
        }
      });
    }
  }

  onDelete(): void {
    if (!this.selectedEvent || !confirm('Are you sure you want to delete this event?')) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    this.eventsService.deleteEvent(this.selectedEvent.id).subscribe({
      next: (success) => {
        this.isDeleting = false;
        if (success) {
          this.eventDeleted.emit();
          this.closeForm();
        } else {
          this.errorMessage = 'Failed to delete event. Please try again.';
        }
      },
      error: (error) => {
        console.error('Delete event error:', error);
        this.isDeleting = false;
        this.errorMessage = 'An error occurred while deleting the event.';
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.eventData.title?.trim() &&
      this.eventData.date &&
      this.eventData.type
    );
  }

  closeForm(): void {
    this.formClosed.emit();
  }

  getFormTitle(): string {
    if (this.isEditMode) {
      return 'Edit Event';
    }
    return this.selectedDate ? 'Add Event' : 'Create New Event';
  }
}