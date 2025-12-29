import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { FamilyTreeService } from './services/family-tree.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'family-tree';
  private subscription = new Subscription();
  private lastFamilyName = '';

  constructor(
    private titleService: Title,
    private familyTreeService: FamilyTreeService
  ) {}

  ngOnInit(): void {
    // Subscribe to family tree changes to update page title
    this.subscription.add(
      this.familyTreeService.familyTree$.subscribe(familyTree => {
        if (familyTree) {
          this.updatePageTitle();
        }
      })
    );

    // Set initial title
    this.updatePageTitle();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updatePageTitle(): void {
    const familyName = this.getFamilyName();
    
    // Only update if the family name has changed to prevent unnecessary updates
    if (familyName !== this.lastFamilyName) {
      this.titleService.setTitle(familyName);
      this.lastFamilyName = familyName;
    }
  }

  private getFamilyName(): string {
    const familyTree = this.familyTreeService.getFamilyTree();
    
    if (!familyTree || !familyTree.members || familyTree.members.length === 0) {
      return 'Family Tree';
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
      return `${lastName} Family Tree`;
    }

    // Fallback to any first generation male member
    const firstGenMale = familyTree.members.find(member => 
      !member.parentId && member.gender === 'male'
    );

    if (firstGenMale && firstGenMale.name) {
      const nameParts = firstGenMale.name.trim().split(' ');
      const lastName = nameParts[nameParts.length - 1];
      return `${lastName} Family Tree`;
    }

    return 'Family Tree';
  }
}
