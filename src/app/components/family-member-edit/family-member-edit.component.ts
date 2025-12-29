import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FamilyMember } from '../../models/family-member.model';
import { FamilyTreeService } from '../../services/family-tree.service';

@Component({
  selector: 'app-family-member-edit',
  imports: [CommonModule, FormsModule],
  templateUrl: './family-member-edit.component.html',
  styleUrl: './family-member-edit.component.scss'
})
export class FamilyMemberEditComponent implements OnInit {
  @Input() member!: FamilyMember;
  @Output() memberUpdated = new EventEmitter<FamilyMember>();
  @Output() memberDeleted = new EventEmitter<string>();
  @Output() formClosed = new EventEmitter<void>();

  editMember: Partial<FamilyMember> = {};
  
  relations = [
    'Son', 'Daughter', 'Father', 'Mother', 'Grandfather', 'Grandmother',
    'Grandson', 'Granddaughter', 'Brother', 'Sister', 'Uncle', 'Aunt',
    'Nephew', 'Niece', 'Cousin', 'Son-in-law', 'Daughter-in-law',
    'Father-in-law', 'Mother-in-law', 'Spouse', 'Friend', 'Other'
  ];

  potentialParents: FamilyMember[] = [];
  isSubmitting = false;
  isDeleting = false;
  errorMessage = '';
  successMessage = '';
  showDeleteConfirm = false;

  constructor(private familyTreeService: FamilyTreeService) {}

  ngOnInit(): void {
    // Initialize edit form with current member data
    this.editMember = {
      id: this.member.id,
      name: this.member.name,
      age: this.member.age,
      designation: this.member.designation,
      relation: this.member.relation,
      gender: this.member.gender,
      parentId: this.member.parentId || ''
    };

    // Get potential parents (excluding self and descendants)
    this.potentialParents = this.familyTreeService.getPotentialParents()
      .filter(parent => parent.id !== this.member.id && !this.isDescendant(parent.id));
  }

  private isDescendant(potentialParentId: string): boolean {
    // Check if the potential parent is actually a descendant of current member
    const checkDescendant = (memberId: string): boolean => {
      const member = this.familyTreeService.getMemberById(memberId);
      if (!member) return false;
      if (member.parentId === this.member.id) return true;
      if (member.parentId) return checkDescendant(member.parentId);
      return false;
    };
    return checkDescendant(potentialParentId);
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updatedMember: FamilyMember = {
      id: this.member.id,
      name: this.editMember.name!.trim(),
      age: Number(this.editMember.age!),
      designation: this.editMember.designation!.trim(),
      relation: this.editMember.relation!,
      gender: this.editMember.gender as 'male' | 'female',
      parentId: this.editMember.parentId || undefined
    };

    this.familyTreeService.updateFamilyMember(this.member.id, updatedMember).subscribe({
      next: (success) => {
        this.isSubmitting = false;
        if (success) {
          this.successMessage = 'Family member updated successfully!';
          this.memberUpdated.emit(updatedMember);
          setTimeout(() => {
            this.closeForm();
          }, 1500);
        } else {
          this.errorMessage = 'Failed to update family member. Please try again.';
        }
      },
      error: (error) => {
        console.error('Update member error:', error);
        this.isSubmitting = false;
        this.errorMessage = 'An error occurred while updating the family member.';
      }
    });
  }

  onDelete(): void {
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    this.isDeleting = true;
    this.errorMessage = '';

    this.familyTreeService.deleteFamilyMember(this.member.id).subscribe({
      next: (success) => {
        this.isDeleting = false;
        if (success) {
          this.memberDeleted.emit(this.member.id);
          this.closeForm();
        } else {
          this.errorMessage = 'Failed to delete family member. Please try again.';
          this.showDeleteConfirm = false;
        }
      },
      error: (error) => {
        console.error('Delete member error:', error);
        this.isDeleting = false;
        this.errorMessage = 'An error occurred while deleting the family member.';
        this.showDeleteConfirm = false;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  isFormValid(): boolean {
    const isValid = !!(
      this.editMember.name?.trim() && 
      this.editMember.age && 
      this.editMember.age > 0 &&
      this.editMember.designation?.trim() && 
      this.editMember.relation &&
      this.editMember.gender
    );
    
    return isValid;
  }

  closeForm(): void {
    this.formClosed.emit();
  }

  onParentChange(): void {
    this.errorMessage = '';
  }

  getParentName(parentId: string): string {
    const parent = this.potentialParents.find(p => p.id === parentId);
    return parent ? parent.name : 'Unknown';
  }
}