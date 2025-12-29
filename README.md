# Family Tree Application

A comprehensive Angular 19 application for visualizing and managing family relationships with an interactive tree structure.

## Features

### 🌳 Interactive Family Tree Visualization
- **Hierarchical Display**: Shows family members in a tree structure with clear generational levels
- **Visual Relationships**: Displays parent-child relationships with connecting lines
- **Spouse Connections**: Shows married couples with visual indicators
- **Responsive Design**: Adapts to different screen sizes and devices

### 👥 Family Member Information
Each family member displays:
- **Name**: Full name of the family member
- **Age**: Current age
- **Designation**: Job title or occupation
- **Relation**: Relationship to other family members (e.g., Son, Daughter, Grandfather)
- **Gender**: Male or female with color-coded avatars
- **Avatar**: Initial-based circular avatar with gender-specific colors

### 🎯 Interactive Features
- **Click to Select**: Click on any family member to view detailed information
- **Details Panel**: Side panel showing comprehensive member information
- **Add New Members**: Form to add new family members with validation
- **Relationship Mapping**: Automatic parent-child relationship establishment

### 📱 User Interface
- **Modern Design**: Clean, professional interface with gradient backgrounds
- **Color Coding**: Different colors for different generations and relationships
- **Hover Effects**: Interactive hover states for better user experience
- **Mobile Responsive**: Optimized for mobile and tablet devices

## Technical Implementation

### Architecture
- **Angular 19**: Latest Angular framework with standalone components
- **TypeScript**: Strongly typed development
- **SCSS**: Advanced styling with variables and mixins
- **Reactive Forms**: Form validation and data binding

### Components Structure
```
src/app/
├── components/
│   ├── family-tree/              # Main tree visualization
│   └── family-member-form/       # Add member form
├── models/
│   └── family-member.model.ts    # Data models
├── services/
│   └── family-tree.service.ts    # Business logic
└── pages/
    └── dashboard/                # Main dashboard page
```

### Data Model
```typescript
interface FamilyMember {
  id: string;
  name: string;
  age: number;
  designation: string;
  relation: string;
  parentId?: string;
  children?: FamilyMember[];
  spouse?: FamilyMember;
  gender: 'male' | 'female';
}
```

## Sample Family Data

The application comes with pre-populated sample data including:
- **Grandparents**: John & Mary Smith (Patriarch & Matriarch)
- **Parents**: Robert & Lisa Smith, Sarah & Mike Johnson
- **Children**: Emma, James, Sophie, Alex (various ages and occupations)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Angular CLI (v19 or higher)

### Installation
```bash
npm install
```

### Development Server
```bash
npm start
```
Navigate to `http://localhost:4200/`

### Build
```bash
npm run build
```

## Usage

1. **View Family Tree**: The main dashboard displays the complete family tree
2. **Select Members**: Click on any family member to see detailed information
3. **Add New Members**: Click the "Add Family Member" button to add new members
4. **Form Validation**: Fill in required fields (name, age, designation, relation)
5. **Relationship Setup**: Optionally specify parent ID to establish relationships

## Customization

### Adding New Relations
Edit the `relations` array in `family-member-form.component.ts`:
```typescript
relations = [
  'Son', 'Daughter', 'Father', 'Mother',
  // Add custom relations here
];
```

### Styling Customization
Modify SCSS variables in component stylesheets:
- Colors for different generations
- Avatar sizes and styles
- Layout spacing and dimensions

## Future Enhancements

- **Photo Upload**: Add profile photos for family members
- **Family Statistics**: Age distribution, generation counts
- **Export Features**: PDF export of family tree
- **Search Functionality**: Find family members by name or relation
- **Family Events**: Add birthdays, anniversaries, and important dates
- **Multiple Family Trees**: Support for different family branches

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.