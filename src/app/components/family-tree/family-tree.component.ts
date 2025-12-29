import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FamilyMember, FamilyTree } from '../../models/family-member.model';
import { FamilyTreeService } from '../../services/family-tree.service';
import { FamilyMemberFormComponent } from '../family-member-form/family-member-form.component';
import { FamilyMemberEditComponent } from '../family-member-edit/family-member-edit.component';

@Component({
  selector: 'app-family-tree',
  imports: [CommonModule, FamilyMemberFormComponent, FamilyMemberEditComponent],
  templateUrl: './family-tree.component.html',
  styleUrl: './family-tree.component.scss'
})
export class FamilyTreeComponent implements OnInit, OnDestroy {
  familyTree!: FamilyTree;
  selectedMember: FamilyMember | null = null;
  showAddForm = false;
  showEditForm = false;
  memberToEdit: FamilyMember | null = null;
  targetGeneration: number | null = null;
  familyName = 'Family Tree';
  
  private subscription = new Subscription();

  constructor(
    private familyTreeService: FamilyTreeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to family tree changes
    this.subscription.add(
      this.familyTreeService.familyTree$.subscribe(familyTree => {
        if (familyTree) {
          this.familyTree = familyTree;
          this.updateFamilyName(); // Update family name when tree changes
          this.cdr.detectChanges(); // Force change detection
        }
      })
    );

    // Get initial family tree
    this.familyTree = this.familyTreeService.getFamilyTree();
    this.updateFamilyName(); // Set initial family name
    
    // Listen for add member form trigger from sidenav
    window.addEventListener('showAddMemberForm', this.handleShowAddMemberForm.bind(this));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    window.removeEventListener('showAddMemberForm', this.handleShowAddMemberForm.bind(this));
  }

  private handleShowAddMemberForm(): void {
    this.showAddMemberForm();
  }

  selectMember(member: FamilyMember): void {
    this.selectedMember = member;
  }

  showAddMemberForm(): void {
    this.targetGeneration = null;
    this.showAddForm = true;
  }

  showAddMemberFormForGeneration(generation: number): void {
    this.targetGeneration = generation;
    this.showAddForm = true;
  }

  onMemberAdded(member: FamilyMember): void {
    // Don't call addFamilyMember again here since the form already did it
    // Just close the form and let the subscription handle the UI update
    this.showAddForm = false;
  }

  onFormClosed(): void {
    this.showAddForm = false;
    this.targetGeneration = null;
  }

  // Generation-based display methods
  getGenerationLevels(): { level: number; members: FamilyMember[]; title: string }[] {
    if (!this.familyTree || !this.familyTree.members || this.familyTree.members.length === 0) {
      return [];
    }

    const generationMap = new Map<number, FamilyMember[]>();
    const memberLevels = new Map<string, number>();

    // First pass: Calculate generation levels based on parent-child relationships
    this.familyTree.members.forEach(member => {
      if (!memberLevels.has(member.id)) {
        const level = this.calculateGenerationLevel(member, memberLevels);
        memberLevels.set(member.id, level);
      }
    });

    // Second pass: Adjust spouse generations to match their partners
    this.adjustSpouseGenerations(memberLevels);

    // Group members by their final generation levels
    this.familyTree.members.forEach(member => {
      const level = memberLevels.get(member.id) || 1;
      
      if (!generationMap.has(level)) {
        generationMap.set(level, []);
      }
      generationMap.get(level)!.push(member);
    });

    // Convert to sorted array
    const generations = Array.from(generationMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, members]) => ({
        level: level || 1,
        members: this.groupSpouses(members || []),
        title: this.getGenerationTitle(level || 1)
      }))
      .filter(gen => gen.members.length > 0); // Only include generations with members

    return generations;
  }

  private adjustSpouseGenerations(memberLevels: Map<string, number>): void {
    if (!this.familyTree || !this.familyTree.members || this.familyTree.members.length === 0) {
      return;
    }

    // Create a map to track spouse pairs and their target generation
    const spousePairs = new Map<string, string>();
    const processedPairs = new Set<string>();

    // First, identify all spouse pairs using spouseId
    this.familyTree.members.forEach(member => {
      if (member.spouseId && !processedPairs.has(member.id)) {
        const spouse = this.familyTree.members.find(m => m.id === member.spouseId);
        if (spouse) {
          spousePairs.set(member.id, spouse.id);
          processedPairs.add(member.id);
          processedPairs.add(spouse.id);
        }
      }
    });

    // Also detect spouse pairs based on relationships
    this.familyTree.members.forEach(member => {
      if (!processedPairs.has(member.id)) {
        const detectedSpouse = this.findSpouseByRelationship(member);
        if (detectedSpouse && !processedPairs.has(detectedSpouse.id)) {
          spousePairs.set(member.id, detectedSpouse.id);
          processedPairs.add(member.id);
          processedPairs.add(detectedSpouse.id);
        }
      }
    });

    // Now adjust generations for spouse pairs
    spousePairs.forEach((spouseId, memberId) => {
      const memberLevel = memberLevels.get(memberId) || 1;
      const spouseLevel = memberLevels.get(spouseId) || 1;
      
      // Determine the target generation for this couple
      const targetLevel = this.determineSpouseGenerationLevel(memberId, spouseId, memberLevel, spouseLevel);
      
      // Set both spouses to the same generation
      memberLevels.set(memberId, targetLevel);
      memberLevels.set(spouseId, targetLevel);
    });
  }

  private findSpouseByRelationship(member: FamilyMember): FamilyMember | null {
    if (!this.familyTree || !this.familyTree.members || !member) {
      return null;
    }

    return this.familyTree.members.find(m => {
      if (m.id === member.id) return false;
      
      // Check for spouse-like relationships
      return (
        (member.relation === 'Father' && m.relation === 'Mother') ||
        (member.relation === 'Mother' && m.relation === 'Father') ||
        (member.relation === 'Patriarch' && m.relation === 'Matriarch') ||
        (member.relation === 'Matriarch' && m.relation === 'Patriarch') ||
        (member.relation === 'Son' && m.relation === 'Daughter-in-law') ||
        (member.relation === 'Daughter' && m.relation === 'Son-in-law') ||
        (member.relation === 'Son-in-law' && m.relation === 'Daughter') ||
        (member.relation === 'Daughter-in-law' && m.relation === 'Son')
      );
    }) || null;
  }

  private determineSpouseGenerationLevel(memberId: string, spouseId: string, memberLevel: number, spouseLevel: number): number {
    const member = this.familyTree.members.find(m => m.id === memberId);
    const spouse = this.familyTree.members.find(m => m.id === spouseId);
    
    if (!member || !spouse) return Math.min(memberLevel, spouseLevel);

    // For in-law relationships, the in-law should match their spouse's generation
    // regardless of their own family tree position
    if (member.relation.includes('in-law')) {
      return spouseLevel; // In-law takes spouse's generation
    }
    
    if (spouse.relation.includes('in-law')) {
      return memberLevel; // Spouse (in-law) takes member's generation
    }
    
    // For traditional couples (same family), use the higher generation (closer to root)
    return Math.min(memberLevel, spouseLevel);
  }

  private calculateGenerationLevel(member: FamilyMember, memberLevels: Map<string, number>, visited: Set<string> = new Set()): number {
    // If already calculated, return cached value
    if (memberLevels.has(member.id)) {
      return memberLevels.get(member.id)!;
    }

    // Prevent infinite recursion by checking if we've already visited this member
    if (visited.has(member.id)) {
      // Circular reference detected, treat as root
      memberLevels.set(member.id, 1);
      return 1;
    }

    // Add to visited set
    visited.add(member.id);

    // If no parent, this is generation 1 (root generation)
    if (!member.parentId) {
      memberLevels.set(member.id, 1);
      visited.delete(member.id); // Remove from visited when done
      return 1;
    }

    // Find parent and calculate level
    const parent = this.familyTree.members.find(m => m.id === member.parentId);
    if (parent) {
      const parentLevel = this.calculateGenerationLevel(parent, memberLevels, visited);
      const childLevel = parentLevel + 1;
      memberLevels.set(member.id, childLevel);
      visited.delete(member.id); // Remove from visited when done
      return childLevel;
    }

    // Fallback to generation 1 if parent not found
    memberLevels.set(member.id, 1);
    visited.delete(member.id); // Remove from visited when done
    return 1;
  }

  private groupSpouses(members: FamilyMember[]): FamilyMember[] {
    if (!members || members.length === 0) {
      return [];
    }

    // Group spouses together in the display order
    const processed = new Set<string>();
    const grouped: FamilyMember[] = [];

    members.forEach(member => {
      if (!processed.has(member.id)) {
        grouped.push(member);
        processed.add(member.id);

        // Add spouse right after if exists
        const spouse = this.getSpouse(member);
        if (spouse && members.includes(spouse) && !processed.has(spouse.id)) {
          grouped.push(spouse);
          processed.add(spouse.id);
        }
      }
    });

    return grouped;
  }

  getGenerationTitle(level: number): string {
    const titles = [
      '', // 0 - not used
      '👑 First Generation (Founders)',
      '🌟 Second Generation (Children)',
      '🌱 Third Generation (Grandchildren)',
      '🌸 Fourth Generation (Great-Grandchildren)',
      '🌺 Fifth Generation (Great-Great-Grandchildren)',
      '🌻 Sixth Generation'
    ];
    return titles[level] || `Generation ${level}`;
  }

  getSpouse(member: FamilyMember): FamilyMember | null {
    if (!this.familyTree || !this.familyTree.members || !member) {
      return null;
    }
    
    // Check if member has a spouse property
    if (member.spouse) {
      return member.spouse;
    }
    
    // Look for spouse based on relationships and same parent level
    const potentialSpouses = this.familyTree.members.filter(m => {
      if (m.id === member.id) return false;
      
      // Same parent level (both have no parent or same parent)
      const sameParentLevel = m.parentId === member.parentId;
      
      // Spouse-like relationships
      const isSpouseRelation = (
        // Traditional couples
        (member.relation === 'Father' && m.relation === 'Mother') ||
        (member.relation === 'Mother' && m.relation === 'Father') ||
        (member.relation === 'Patriarch' && m.relation === 'Matriarch') ||
        (member.relation === 'Matriarch' && m.relation === 'Patriarch') ||
        
        // Children and their spouses
        (member.relation === 'Son' && m.relation === 'Daughter-in-law') ||
        (member.relation === 'Daughter' && m.relation === 'Son-in-law') ||
        (member.relation === 'Son-in-law' && m.relation === 'Daughter') ||
        (member.relation === 'Daughter-in-law' && m.relation === 'Son') ||
        
        // Same generation siblings who might be married to each other
        (member.relation === 'Brother' && m.relation === 'Sister') ||
        (member.relation === 'Sister' && m.relation === 'Brother')
      );
      
      // For in-laws, they should be at the same generation level even if parent IDs differ
      const isInLawRelation = member.relation.includes('in-law') || m.relation.includes('in-law');
      
      return (sameParentLevel || isInLawRelation) && isSpouseRelation;
    });
    
    return potentialSpouses.length > 0 ? potentialSpouses[0] : null;
  }

  isSpouse(member1: FamilyMember, member2: FamilyMember): boolean {
    const spouse = this.getSpouse(member1);
    return spouse?.id === member2.id;
  }

  getFamilyName(): string {
    if (!this.familyTree || !this.familyTree.members) {
      return 'Family Tree';
    }

    // Find the first generation father (Patriarch or Father)
    const patriarch = this.familyTree.members.find(member => 
      member.relation === 'Patriarch' || 
      (member.relation === 'Father' && !member.parentId)
    );

    if (patriarch && patriarch.name) {
      // Extract last name from full name
      const nameParts = patriarch.name.trim().split(' ');
      const lastName = nameParts[nameParts.length - 1];
      return `${lastName} Family Tree`;
    }

    // Fallback to any first generation male member
    const firstGenMale = this.familyTree.members.find(member => 
      !member.parentId && member.gender === 'male'
    );

    if (firstGenMale && firstGenMale.name) {
      const nameParts = firstGenMale.name.trim().split(' ');
      const lastName = nameParts[nameParts.length - 1];
      return `${lastName} Family Tree`;
    }

    return 'Family Tree';
  }

  private updateFamilyName(): void {
    this.familyName = this.getFamilyName();
  }

  getParentName(parentId: string): string {
    if (!this.familyTree || !this.familyTree.members || !parentId) {
      return 'Unknown';
    }
    const parent = this.familyTree.members.find(member => member.id === parentId);
    return parent ? parent.name : 'Unknown';
  }

  // Edit/Delete functionality
  editMember(member: FamilyMember): void {
    this.memberToEdit = member;
    this.showEditForm = true;
    this.selectedMember = null; // Close details panel
  }

  deleteMember(member: FamilyMember): void {
    this.familyTreeService.deleteFamilyMember(member.id).subscribe({
      next: (success) => {
        if (success) {
          this.selectedMember = null; // Close details panel
        }
      },
      error: (error) => {
        console.error('Delete error:', error);
      }
    });
  }

  onMemberUpdated(updatedMember: FamilyMember): void {
    this.showEditForm = false;
    this.memberToEdit = null;
  }

  onMemberDeleted(memberId: string): void {
    this.showEditForm = false;
    this.memberToEdit = null;
  }

  onEditFormClosed(): void {
    this.showEditForm = false;
    this.memberToEdit = null;
  }
}