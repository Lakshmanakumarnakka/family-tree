import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { FamilyMember, FamilyTree, FamilyData } from '../models/family-member.model';

@Injectable({
  providedIn: 'root'
})
export class FamilyTreeService {
  private familyTreeSubject = new BehaviorSubject<FamilyTree | null>(null);
  public familyTree$ = this.familyTreeSubject.asObservable();

  private familyDataSubject = new BehaviorSubject<FamilyData | null>(null);
  public familyData$ = this.familyDataSubject.asObservable();

  private readonly JSON_FILE_PATH = 'assets/data/family-data.json';
  private readonly LOCAL_STORAGE_KEY = 'family-tree-data';

  private familyMembers: FamilyMember[] = [];
  private familyInfo: any = {};
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadFamilyData();
  }
  // Load family data from JSON file or localStorage
  private loadFamilyData(): void {
    // First try to load from localStorage (for saved changes) - only in browser
    if (this.isBrowser) {
      const savedData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      
      if (savedData) {
        try {
          const parsedData: FamilyData = JSON.parse(savedData);
          this.setFamilyData(parsedData);
          return;
        } catch (error) {
          console.error('Error parsing saved data, loading from JSON file:', error);
        }
      }
    }

    // Load from JSON file if no saved data or not in browser
    if (this.isBrowser) {
      // Only try to load JSON file in browser environment
      this.http.get<FamilyData>(this.JSON_FILE_PATH).pipe(
        catchError(error => {
          console.error('Error loading family data from JSON:', error);
          return of(this.getDefaultFamilyData());
        })
      ).subscribe(data => {
        this.setFamilyData(data);
      });
    } else {
      // In server environment, use default data
      this.setFamilyData(this.getDefaultFamilyData());
    }
  }

  private setFamilyData(data: FamilyData): void {
    this.familyMembers = data.familyMembers || [];
    this.familyInfo = data.familyInfo || {};
    
    this.familyDataSubject.next(data);
    this.refreshFamilyTree();
  }

  // Save family data to localStorage
  public saveFamilyData(): Observable<boolean> {
    return new Observable(observer => {
      try {
        const dataToSave: FamilyData = {
          familyMembers: this.familyMembers,
          familyInfo: {
            ...this.familyInfo,
            totalMembers: this.familyMembers.length,
            lastUpdated: new Date().toISOString()
          }
        };

        // Only save to localStorage in browser environment
        if (this.isBrowser) {
          localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
        }
        
        this.familyDataSubject.next(dataToSave);
        
        observer.next(true);
        observer.complete();
      } catch (error) {
        console.error('Error saving family data:', error);
        observer.next(false);
        observer.complete();
      }
    });
  }

  // Export family data as JSON
  public exportFamilyData(): string {
    const dataToExport: FamilyData = {
      familyMembers: this.familyMembers,
      familyInfo: {
        ...this.familyInfo,
        totalMembers: this.familyMembers.length,
        lastUpdated: new Date().toISOString()
      }
    };
    return JSON.stringify(dataToExport, null, 2);
  }

  // Import family data from JSON
  public importFamilyData(jsonData: string): Observable<boolean> {
    return new Observable(observer => {
      try {
        const importedData: FamilyData = JSON.parse(jsonData);
        
        // Validate the imported data structure
        if (!importedData.familyMembers || !Array.isArray(importedData.familyMembers)) {
          throw new Error('Invalid family data structure');
        }

        this.setFamilyData(importedData);
        this.saveFamilyData().subscribe(); // Save to localStorage
        
        observer.next(true);
        observer.complete();
      } catch (error) {
        console.error('Error importing family data:', error);
        observer.next(false);
        observer.complete();
      }
    });
  }

  // Reset to default data
  public resetToDefaultData(): Observable<boolean> {
    return new Observable(observer => {
      this.http.get<FamilyData>(this.JSON_FILE_PATH).pipe(
        catchError(error => {
          console.error('Error loading default data:', error);
          return of(this.getDefaultFamilyData());
        })
      ).subscribe(data => {
        this.setFamilyData(data);
        // Clear saved data only in browser environment
        if (this.isBrowser) {
          localStorage.removeItem(this.LOCAL_STORAGE_KEY);
        }
        observer.next(true);
        observer.complete();
      });
    });
  }

  private getDefaultFamilyData(): FamilyData {
    return {
      familyMembers: [
        {
          id: '1',
          name: 'John Smith',
          age: 75,
          designation: 'Retired Engineer',
          relation: 'Patriarch',
          gender: 'male',
          parentId: undefined,
          spouseId: '2',
          dateOfBirth: '1948-03-15',
          placeOfBirth: 'New York, USA',
          occupation: 'Engineer',
          email: 'john.smith@email.com',
          phone: '+1-555-0101',
          address: '123 Main St, Springfield, USA',
          notes: 'Family patriarch, founded the family business'
        },
        {
          id: '2',
          name: 'Mary Smith',
          age: 72,
          designation: 'Retired Teacher',
          relation: 'Matriarch',
          gender: 'female',
          parentId: undefined,
          spouseId: '1',
          dateOfBirth: '1951-07-22',
          placeOfBirth: 'Boston, USA',
          occupation: 'Teacher',
          email: 'mary.smith@email.com',
          phone: '+1-555-0102',
          address: '123 Main St, Springfield, USA',
          notes: 'Family matriarch, dedicated educator'
        }
      ],
      familyInfo: {
        familyName: 'Smith Family',
        motto: 'Unity in Diversity',
        established: new Date().getFullYear().toString(),
        location: 'Springfield, USA',
        totalMembers: 2,
        generations: 1,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  getFamilyTree(): FamilyTree {
    return this.buildFamilyTree();
  }

  private buildFamilyTree(): FamilyTree {
    if (!this.familyMembers || this.familyMembers.length === 0) {
      // Return empty tree with default member
      const defaultMember: FamilyMember = {
        id: 'default',
        name: 'Default Member',
        age: 50,
        designation: 'Family Member',
        relation: 'Patriarch',
        gender: 'male'
      };
      return {
        root: defaultMember,
        members: [defaultMember]
      };
    }

    const membersMap = new Map<string, FamilyMember>();
    
    // Create a map of all members
    this.familyMembers.forEach(member => {
      membersMap.set(member.id, { ...member, children: [] });
    });

    // Set up parent-child relationships
    this.familyMembers.forEach(member => {
      if (member.parentId) {
        const parent = membersMap.get(member.parentId);
        const child = membersMap.get(member.id);
        if (parent && child) {
          parent.children = parent.children || [];
          parent.children.push(child);
        }
      }
    });

    // Set up spouse relationships using spouseId
    this.familyMembers.forEach(member => {
      if (member.spouseId) {
        const spouse = membersMap.get(member.spouseId);
        if (spouse) {
          const memberObj = membersMap.get(member.id);
          if (memberObj) {
            memberObj.spouse = spouse;
            spouse.spouse = memberObj;
          }
        }
      }
    });

    // Auto-detect and set up additional spouse relationships
    this.setupSpouseRelationships(Array.from(membersMap.values()));

    // Find the actual root (member with no parent)
    const actualRoot = this.findActualRoot(Array.from(membersMap.values()));
    
    const familyTree = {
      root: actualRoot,
      members: Array.from(membersMap.values())
    };

    return familyTree;
  }

  private setupSpouseRelationships(members: FamilyMember[]): void {
    members.forEach(member => {
      if (!member.spouse && member.spouseId) {
        const spouse = members.find(m => m.id === member.spouseId);
        if (spouse && !spouse.spouse) {
          member.spouse = spouse;
          spouse.spouse = member;
        }
      }
    });

    // Auto-detect additional spouse relationships based on relation types
    members.forEach(member => {
      if (!member.spouse) {
        const potentialSpouse = members.find(m => {
          if (m.id === member.id || m.spouse) return false;
          
          // Spouse-like relationships - handle cross-family marriages properly
          const isSpouseRelation = (
            // Traditional couples (same family)
            (member.relation === 'Father' && m.relation === 'Mother') ||
            (member.relation === 'Mother' && m.relation === 'Father') ||
            (member.relation === 'Patriarch' && m.relation === 'Matriarch') ||
            (member.relation === 'Matriarch' && m.relation === 'Patriarch') ||
            
            // Children and their spouses (cross-family marriages)
            (member.relation === 'Son' && m.relation === 'Daughter-in-law') ||
            (member.relation === 'Daughter' && m.relation === 'Son-in-law') ||
            (member.relation === 'Son-in-law' && m.relation === 'Daughter') ||
            (member.relation === 'Daughter-in-law' && m.relation === 'Son')
          );
          
          // For traditional couples, they should have the same parent (same family)
          const traditionalCouple = (
            (member.relation === 'Father' && m.relation === 'Mother') ||
            (member.relation === 'Mother' && m.relation === 'Father') ||
            (member.relation === 'Patriarch' && m.relation === 'Matriarch') ||
            (member.relation === 'Matriarch' && m.relation === 'Patriarch')
          );
          
          // For in-law relationships, they should have different parents (different families)
          const inLawCouple = (
            (member.relation === 'Son' && m.relation === 'Daughter-in-law') ||
            (member.relation === 'Daughter' && m.relation === 'Son-in-law') ||
            (member.relation === 'Son-in-law' && m.relation === 'Daughter') ||
            (member.relation === 'Daughter-in-law' && m.relation === 'Son')
          );
          
          if (traditionalCouple) {
            // Same family couples should have same parent or both be root
            return (member.parentId === m.parentId) || (!member.parentId && !m.parentId);
          } else if (inLawCouple) {
            // Cross-family couples should have different parents
            return member.parentId !== m.parentId;
          }
          
          return false;
        });

        if (potentialSpouse) {
          member.spouse = potentialSpouse;
          potentialSpouse.spouse = member;
          
          // Also set spouseId if not already set
          if (!member.spouseId) member.spouseId = potentialSpouse.id;
          if (!potentialSpouse.spouseId) potentialSpouse.spouseId = member.id;
        }
      }
    });
  }

  private findActualRoot(members: FamilyMember[]): FamilyMember {
    // Find members with no parents
    const rootCandidates = members.filter(member => !member.parentId);
    
    // If no root candidates, return the first member or create a default
    if (rootCandidates.length === 0) {
      if (members.length > 0) {
        return members[0];
      }
      // Return a default member if no members exist
      return {
        id: 'default',
        name: 'Default Member',
        age: 50,
        designation: 'Family Member',
        relation: 'Patriarch',
        gender: 'male'
      };
    }
    
    // If there's only one, that's the root
    if (rootCandidates.length === 1) {
      return rootCandidates[0];
    }
    
    // If multiple candidates, prefer Patriarch/Matriarch, then oldest
    const patriarch = rootCandidates.find(m => m.relation === 'Patriarch');
    if (patriarch) return patriarch;
    
    const matriarch = rootCandidates.find(m => m.relation === 'Matriarch');
    if (matriarch) return matriarch;
    
    // Return the oldest member as root (safe reduce with initial value)
    return rootCandidates.reduce((oldest, current) => 
      current.age > oldest.age ? current : oldest, rootCandidates[0]
    );
  }

  addFamilyMember(member: FamilyMember): Observable<boolean> {
    return new Observable(observer => {
      try {
        // Add member to the data array
        this.familyMembers.push(member);
        
        // If member has a spouse, update the spouse's spouseId
        if (member.spouseId) {
          const spouse = this.familyMembers.find(m => m.id === member.spouseId);
          if (spouse && !spouse.spouseId) {
            spouse.spouseId = member.id;
          }
        }
        
        // Refresh the family tree (this will recalculate root and relationships)
        this.refreshFamilyTree();
        
        // Save to localStorage
        this.saveFamilyData().subscribe();
        
        observer.next(true);
        observer.complete();
      } catch (error) {
        console.error('Error in addFamilyMember:', error);
        observer.next(false);
        observer.complete();
      }
    });
  }

  updateFamilyMember(id: string, updates: Partial<FamilyMember>): Observable<boolean> {
    return new Observable(observer => {
      try {
        const index = this.familyMembers.findIndex(m => m.id === id);
        if (index !== -1) {
          // Create updated member with all required fields
          const updatedMember: FamilyMember = {
            ...this.familyMembers[index],
            ...updates
          };
          this.familyMembers[index] = updatedMember;
          
          // Refresh the family tree (this will recalculate root and relationships)
          this.refreshFamilyTree();
          
          // Save to localStorage
          this.saveFamilyData().subscribe();
          
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      } catch (error) {
        console.error('Error updating member:', error);
        observer.next(false);
        observer.complete();
      }
    });
  }

  deleteFamilyMember(id: string): Observable<boolean> {
    return new Observable(observer => {
      try {
        const index = this.familyMembers.findIndex(m => m.id === id);
        if (index !== -1) {
          // Remove the member
          const deletedMember = this.familyMembers[index];
          this.familyMembers.splice(index, 1);
          
          // Update any children to remove parent reference
          this.familyMembers.forEach(member => {
            if (member.parentId === id) {
              member.parentId = undefined;
            }
            // Remove spouse reference
            if (member.spouseId === id) {
              member.spouseId = undefined;
            }
          });
          
          this.refreshFamilyTree();
          
          // Save to localStorage
          this.saveFamilyData().subscribe();
          
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      } catch (error) {
        console.error('Error deleting member:', error);
        observer.next(false);
        observer.complete();
      }
    });
  }

  getAllMembers(): FamilyMember[] {
    return this.familyMembers ? [...this.familyMembers] : [];
  }

  getMemberById(id: string): FamilyMember | undefined {
    return this.familyMembers ? this.familyMembers.find(m => m.id === id) : undefined;
  }

  getPotentialParents(): FamilyMember[] {
    // Return members who could be parents (adults)
    return this.familyMembers ? this.familyMembers.filter(member => member.age >= 18) : [];
  }

  private refreshFamilyTree(): void {
    const familyTree = this.buildFamilyTree();
    this.familyTreeSubject.next(familyTree);
  }
}