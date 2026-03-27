import React from 'react';
import { useStudentInfoSections } from './hooks';
import { Student } from './types';
import { User, Users, Calendar, MapPin, Phone, Mail, GraduationCap, Award, BookOpen } from 'lucide-react';
import Card from './ui/Card';

interface OverviewTabProps {
  selectedStudent: Student;
  theme: 'dark' | 'light';
}

const OverviewTab: React.FC<OverviewTabProps> = ({ selectedStudent, theme }) => {
  const sections = useStudentInfoSections(selectedStudent, theme);

  // Enhanced design system with colors and gradients
  const containerStyles = 'space-y-4 max-h-[60vh] overflow-y-auto p-2';
  const gridStyles = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3';

  // Color-coded section styles
  const getSectionStyles = (sectionIndex: number) => {
    const colorSchemes = [
      {
        gradient: theme === 'dark' 
          ? 'from-blue-600/20 to-purple-600/20 border-blue-500/30' 
          : 'from-blue-50 to-purple-50 border-blue-200',
        iconBg: theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100',
        iconColor: 'text-blue-500',
        titleBg: theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
      },
      {
        gradient: theme === 'dark' 
          ? 'from-green-600/20 to-emerald-600/20 border-green-500/30' 
          : 'from-green-50 to-emerald-50 border-green-200',
        iconBg: theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100',
        iconColor: 'text-green-500',
        titleBg: theme === 'dark' ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
      },
      {
        gradient: theme === 'dark' 
          ? 'from-orange-600/20 to-red-600/20 border-orange-500/30' 
          : 'from-orange-50 to-red-50 border-orange-200',
        iconBg: theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100',
        iconColor: 'text-orange-500',
        titleBg: theme === 'dark' ? 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'
      }
    ];
    
    return colorSchemes[sectionIndex % colorSchemes.length];
  };

  const getSectionIcon = (title: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      'Basic Information': User,
      'Parents Information': Users,
      'Contact & Address': MapPin,
      'Academic Information': GraduationCap,
      'Emergency Contact': Phone,
    };
    return iconMap[title] || User;
  };

  const labelStyles = `text-xs font-medium uppercase tracking-wider ${
    theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
  }`;

  const valueStyles = `mt-1 text-sm font-medium ${
    theme === 'dark' ? 'text-white' : 'text-gray-900'
  }`;

  const headingStyles = `text-base font-bold mb-3 flex items-center gap-2`;

  return (
    <div className={containerStyles}>
      {sections.map((section, index) => {
        const sectionStyles = getSectionStyles(index);
        const IconComponent = getSectionIcon(section.title);
        
        return (
          <Card key={index} theme={theme} className={`relative overflow-hidden ${sectionStyles.gradient} border backdrop-blur-sm`}>
            {/* Decorative gradient overlay */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${sectionStyles.gradient} opacity-50 rounded-full blur-3xl`}></div>
            
            {/* Section Header */}
            <div className="relative">
              <h3 className={headingStyles}>
                <div className={`p-1.5 rounded-lg ${sectionStyles.iconBg} ${sectionStyles.iconColor}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className={sectionStyles.titleBg}>{section.title}</span>
              </h3>
            </div>

            {/* Fields Grid */}
            <div className={gridStyles}>
              {section.fields.map((field, fieldIndex) => (
                <div 
                  key={fieldIndex} 
                  className={`relative p-2 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50' 
                      : 'bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300/50'
                  } transition-all duration-300 hover:shadow-md hover:scale-105`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <label className={labelStyles}>{field.label}</label>
                      <p className={`${valueStyles} truncate`}>{field.value || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom decorative line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${sectionStyles.gradient} opacity-60`}></div>
          </Card>
        );
      })}
    </div>
  );
};

export default OverviewTab;
