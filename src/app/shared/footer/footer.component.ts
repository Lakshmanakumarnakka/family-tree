import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FamilyTreeService } from '../../services/family-tree.service';
import { FamilyTree } from '../../models/family-member.model';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();
  familyName = 'Family';
  private subscription = new Subscription();
  
  familyLinks = [
    { label: 'Family Tree', url: '#' },
    { label: 'Add Member', url: '#' },
    { label: 'Family Events', url: '#' },
    { label: 'Photo Gallery', url: '#' }
  ];

  supportLinks = [
    { label: 'Help Center', url: '#' },
    { label: 'Privacy Policy', url: '#' },
    { label: 'Terms of Service', url: '#' },
    { label: 'Contact Us', url: '#' }
  ];

  socialLinks = [
    { label: 'Facebook', icon: '📘', url: '#' },
    { label: 'Instagram', icon: '📷', url: '#' },
    { label: 'Twitter', icon: '🐦', url: '#' },
    { label: 'Email', icon: '📧', url: '#' }
  ];

  familyStats = {
    totalMembers: 0,
    generations: 0,
    maleMembers: 0,
    femaleMembers: 0,
    averageAge: 0,
    oldestMember: 0,
    youngestMember: 0
  };

  constructor(private familyTreeService: FamilyTreeService) {}

  ngOnInit(): void {
    // Subscribe to family tree changes to update statistics
    this.subscription.add(
      this.familyTreeService.familyTree$.subscribe(familyTree => {
        if (familyTree) {
          this.updateFamilyStats(familyTree);
          this.updateFamilyName(); // Update family name when tree changes
        }
      })
    );

    // Get initial family tree
    const initialTree = this.familyTreeService.getFamilyTree();
    if (initialTree) {
      this.updateFamilyStats(initialTree);
      this.updateFamilyName(); // Set initial family name
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getFamilyName(): string {
    const familyTree = this.familyTreeService.getFamilyTree();
    
    if (!familyTree || !familyTree.members) {
      return 'Family';
    }

    // Find the first generation father (Patriarch or Father)
    const patriarch = familyTree.members.find(member => 
      member.relation === 'Patriarch' || 
      (member.relation === 'Father' && !member.parentId)
    );

    if (patriarch && patriarch.name) {
      // Extract last name from full name
      const nameParts = patriarch.name.trim().split(' ');
      const lastName = nameParts[nameParts.length - 1];
      return lastName;
    }

    // Fallback to any first generation male member
    const firstGenMale = familyTree.members.find(member => 
      !member.parentId && member.gender === 'male'
    );

    if (firstGenMale && firstGenMale.name) {
      const nameParts = firstGenMale.name.trim().split(' ');
      const lastName = nameParts[nameParts.length - 1];
      return lastName;
    }

    return 'Family';
  }

  private updateFamilyName(): void {
    this.familyName = this.getFamilyName();
  }

  private updateFamilyStats(familyTree: FamilyTree): void {
    const members = familyTree.members;
    
    if (members.length === 0) {
      this.familyStats = {
        totalMembers: 0,
        generations: 0,
        maleMembers: 0,
        femaleMembers: 0,
        averageAge: 0,
        oldestMember: 0,
        youngestMember: 0
      };
      return;
    }

    // Calculate basic stats
    this.familyStats.totalMembers = members.length;
    this.familyStats.maleMembers = members.filter(m => m.gender === 'male').length;
    this.familyStats.femaleMembers = members.filter(m => m.gender === 'female').length;

    // Calculate age statistics
    const ages = members.map(m => m.age);
    this.familyStats.averageAge = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
    this.familyStats.oldestMember = Math.max(...ages);
    this.familyStats.youngestMember = Math.min(...ages);

    // Calculate generations
    this.familyStats.generations = this.calculateGenerations(familyTree);
  }

  private calculateGenerations(familyTree: FamilyTree): number {
    const getGenerationLevel = (member: any, level: number = 0): number => {
      if (!member.parentId) {
        return level;
      }
      const parent = familyTree.members.find(m => m.id === member.parentId);
      if (parent) {
        return getGenerationLevel(parent, level + 1);
      }
      return level;
    };

    const generationLevels = familyTree.members.map(member => getGenerationLevel(member));
    return Math.max(...generationLevels, 0) + 1;
  }
}
