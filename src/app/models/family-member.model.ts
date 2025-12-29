export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  designation: string;
  relation: string;
  parentId?: string;
  spouseId?: string;
  children?: FamilyMember[];
  spouse?: FamilyMember;
  gender: 'male' | 'female';
  photo?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  occupation?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface FamilyTree {
  root: FamilyMember;
  members: FamilyMember[];
}

export interface FamilyData {
  familyMembers: FamilyMember[];
  familyInfo: {
    familyName: string;
    motto: string;
    established: string;
    location: string;
    totalMembers: number;
    generations: number;
    lastUpdated: string;
  };
}