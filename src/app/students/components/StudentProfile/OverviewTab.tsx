import React from 'react';
import { useStudentInfoSections } from './hooks';
import { Student } from './types';
import Card from './ui/Card';

interface OverviewTabProps {
  selectedStudent: Student;
  theme: 'dark' | 'light';
}

const OverviewTab: React.FC<OverviewTabProps> = ({ selectedStudent, theme }) => {
  const sections = useStudentInfoSections(selectedStudent, theme);

  // Design system styling
  const cardStyles = `rounded-xl border p-6 shadow-md ${
    theme === 'dark' 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200'
  }`;

  const labelStyles = `text-sm font-semibold ${
    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
  }`;

  const valueStyles = `mt-1 text-base ${
    theme === 'dark' ? 'text-white' : 'text-gray-900'
  }`;

  const headingStyles = `text-xl font-bold mb-4 ${
    theme === 'dark' ? 'text-white' : 'text-gray-900'
  }`;

  const containerStyles = 'space-y-6 max-h-[60vh] overflow-y-auto';
  const gridStyles = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <div className={containerStyles}>
      {sections.map((section, index) => (
        <Card key={index} theme={theme}>
          <h3 className={headingStyles}>{section.title}</h3>
          <div className={gridStyles}>
            {section.fields.map((field, fieldIndex) => (
              <div key={fieldIndex}>
                <label className={labelStyles}>{field.label}</label>
                <p className={valueStyles}>{field.value || 'N/A'}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default OverviewTab;
