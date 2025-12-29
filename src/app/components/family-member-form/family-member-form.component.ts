import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FamilyMember } from '../../models/family-member.model';
import { FamilyTreeService } from '../../services/family-tree.service';

@Component({
  selector: 'app-family-member-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './family-member-form.component.html',
  styleUrl: './family-member-form.component.scss'
})
export class FamilyMemberFormComponent implements OnInit {
  @Input() targetGeneration: number | null = null;
  @Output() memberAdded = new EventEmitter<FamilyMember>();
  @Output() formClosed = new EventEmitter<void>();

  newMember: Partial<FamilyMember> = {
    name: '',
    age: undefined,
    designation: '',
    relation: '',
    gender: 'male',
    parentId: '',
    spouseId: ''
  };

  relations = [
    'Son', 'Daughter', 'Father', 'Mother', 'Grandfather', 'Grandmother',
    'Grandson', 'Granddaughter', 'Brother', 'Sister', 'Uncle', 'Aunt',
    'Nephew', 'Niece', 'Cousin', 'Son-in-law', 'Daughter-in-law',
    'Father-in-law', 'Mother-in-law', 'Spouse', 'Patriarch', 'Matriarch',
    'Friend', 'Other'
  ];

  potentialParents: FamilyMember[] = [];
  potentialSpouses: FamilyMember[] = [];
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private familyTreeService: FamilyTreeService) {}

  ngOnInit(): void {
    this.potentialParents = this.familyTreeService.getPotentialParents() || [];
    this.updatePotentialSpouses();
    
    // Pre-select appropriate relations based on target generation
    if (this.targetGeneration) {
      this.suggestRelationForGeneration(this.targetGeneration);
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

    const member: FamilyMember = {
      id: Date.now().toString(),
      name: this.newMember.name!.trim(),
      age: Number(this.newMember.age!),
      designation: this.newMember.designation!.trim(),
      relation: this.newMember.relation!,
      gender: this.newMember.gender as 'male' | 'female',
      parentId: this.newMember.parentId || undefined,
      spouseId: this.newMember.spouseId || undefined
    };

    this.familyTreeService.addFamilyMember(member).subscribe({
      next: (success) => {
        this.isSubmitting = false;
        if (success) {
          this.successMessage = 'Family member added successfully!';
          this.memberAdded.emit(member);
          setTimeout(() => {
            this.resetForm();
            this.closeForm();
          }, 1500);
        } else {
          this.errorMessage = 'Failed to add family member. Please try again.';
        }
      },
      error: (error) => {
        console.error('Add member error:', error);
        this.isSubmitting = false;
        this.errorMessage = 'An error occurred while adding the family member.';
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.newMember.name?.trim() && 
      this.newMember.age && 
      this.newMember.age > 0 &&
      this.newMember.designation?.trim() && 
      this.newMember.relation &&
      this.newMember.gender
    );
  }

  resetForm(): void {
    this.newMember = {
      name: '',
      age: undefined,
      designation: '',
      relation: '',
      gender: 'male',
      parentId: '',
      spouseId: ''
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeForm(): void {
    this.resetForm();
    this.formClosed.emit();
  }

  onParentChange(): void {
    // Clear any previous errors when parent selection changes
    this.errorMessage = '';
    this.updatePotentialSpouses();
  }

  onRelationChange(): void {
    // Update potential spouses when relation changes
    this.updatePotentialSpouses();
  }

  updatePotentialSpouses(): void {
    const allMembers = this.familyTreeService.getAllMembers() || [];
    
    // Filter potential spouses based on relation and existing relationships
    this.potentialSpouses = allMembers.filter(member => {
      // Don't include members who already have spouses
      if (member.spouseId) return false;
      
      // Filter based on relation type
      if (this.newMember.relation) {
        return this.isCompatibleSpouse(this.newMember.relation, member);
      }
      
      return true;
    });
  }

  private isCompatibleSpouse(relation: string, potentialSpouse: FamilyMember): boolean {
    // Define compatible spouse relationships
    const compatiblePairs: { [key: string]: string[] } = {
      'Son': ['Daughter-in-law'],
      'Daughter': ['Son-in-law'],
      'Son-in-law': ['Daughter'],
      'Daughter-in-law': ['Son'],
      'Father': ['Mother'],
      'Mother': ['Father'],
      'Patriarch': ['Matriarch'],
      'Matriarch': ['Patriarch'],
      'Brother': ['Sister', 'Wife'],
      'Sister': ['Brother', 'Husband'],
      'Grandfather': ['Grandmother'],
      'Grandmother': ['Grandfather']
    };

    const compatibleRelations = compatiblePairs[relation] || [];
    return compatibleRelations.includes(potentialSpouse.relation);
  }

  private suggestRelationForGeneration(generation: number): void {
    // Suggest appropriate relations based on target generation
    const relationSuggestions: { [key: number]: string[] } = {
      1: ['Father', 'Mother', 'Patriarch', 'Matriarch'],
      2: ['Son', 'Daughter', 'Son-in-law', 'Daughter-in-law'],
      3: ['Grandson', 'Granddaughter'],
      4: ['Great-grandson', 'Great-granddaughter']
    };

    const suggestions = relationSuggestions[generation];
    if (suggestions && suggestions.length > 0) {
      // Don't auto-select, just provide context
    }
  }

  getGenerationContext(): string {
    if (this.targetGeneration) {
      const generationNames: { [key: number]: string } = {
        1: 'First Generation (Founders)',
        2: 'Second Generation (Children)',
        3: 'Third Generation (Grandchildren)',
        4: 'Fourth Generation (Great-Grandchildren)'
      };
      return generationNames[this.targetGeneration] || `Generation ${this.targetGeneration}`;
    }
    return '';
  }

  getParentName(parentId: string): string {
    const parent = this.potentialParents.find(p => p.id === parentId);
    return parent ? parent.name : 'Unknown';
  }
}
