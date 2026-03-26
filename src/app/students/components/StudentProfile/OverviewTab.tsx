import React from 'react';
import { useStudentInfoSections } from './hooks';
import { Student } from './types';

interface OverviewTabProps {
  selectedStudent: Student;
  theme: 'dark' | 'light';
}

const OverviewTab: React.FC<OverviewTabProps> = ({ selectedStudent, theme }) => {
  const sections = useStudentInfoSections(selectedStudent, theme);

  const cardStyles = `rounded-lg border p-4 ${
    theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
  }`;

  const labelStyles = `text-sm font-medium ${
    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
  }`;

  const valueStyles = `mt-1 ${
    theme === 'dark' ? 'text-white' : 'text-gray-900'
  }`;

  const headingStyles = `text-lg font-semibold mb-4 ${
    theme === 'dark' ? 'text-white' : 'text-gray-900'
  }`;

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {sections.map((section, index) => (
        <div key={index} className={cardStyles}>
          <h3 className={headingStyles}>{section.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.fields.map((field, fieldIndex) => (
              <div key={fieldIndex}>
                <label className={labelStyles}>{field.label}</label>
                <p className={valueStyles}>{field.value || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewTab;
