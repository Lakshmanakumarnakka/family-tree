import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { HeaderComponent } from "../../shared/header/header.component";
import { FooterComponent } from "../../shared/footer/footer.component";
import { FamilyTreeComponent } from '../../components/family-tree/family-tree.component';
import { EventsWidgetComponent } from '../../components/events-widget/events-widget.component';

@Component({
  selector: 'app-dashboard',
  imports: [HeaderComponent, FooterComponent, FamilyTreeComponent, EventsWidgetComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(FamilyTreeComponent) familyTree!: FamilyTreeComponent;

  eventsCollapsed = false;

  ngOnInit(): void {
    // Listen for add member form trigger from header
    window.addEventListener('showAddMemberForm', this.handleShowAddMemberForm.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('showAddMemberForm', this.handleShowAddMemberForm.bind(this));
  }

  private handleShowAddMemberForm(): void {
    if (this.familyTree) {
      this.familyTree.showAddMemberForm();
    }
  }

  toggleEvents(): void {
    this.eventsCollapsed = !this.eventsCollapsed;
  }
}
