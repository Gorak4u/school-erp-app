import React from 'react';
import { Student } from './types';

interface AcademicsTabProps {
  selectedStudent: Student;
  theme: 'dark' | 'light';
  onViewDetailedAnalytics: () => void;
}

const AcademicsTab: React.FC<AcademicsTabProps> = ({
  selectedStudent,
  theme,
  onViewDetailedAnalytics
}) => {
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

  const statCardStyles = (bgColor: string, textColor: string, iconColor: string) => `
    ${cardStyles} flex items-center justify-between
  `;

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 pb-2">
        <h3 className={`text-xl font-semibold ${headingStyles}`}>
          Academic Performance
        </h3>
        <button
          onClick={onViewDetailedAnalytics}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          📊 View Detailed Analytics
        </button>
      </div>
      
      {/* Academic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={statCardStyles('green', 'text-green-600', 'text-green-400')}>
          <div>
            <p className={labelStyles}>Current GPA</p>
            <p className={`text-2xl font-bold mt-1 ${valueStyles}`}>
              {selectedStudent.gpa?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
          }`}>
            📈
          </div>
        </div>
        
        <div className={statCardStyles('blue', 'text-blue-600', 'text-blue-400')}>
          <div>
            <p className={labelStyles}>Class Rank</p>
            <p className={`text-2xl font-bold mt-1 ${valueStyles}`}>
              {selectedStudent.rank || 'N/A'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
          }`}>
            🏆
          </div>
        </div>
        
        <div className={statCardStyles('purple', 'text-purple-600', 'text-purple-400')}>
          <div>
            <p className={labelStyles}>Attendance</p>
            <p className={`text-2xl font-bold mt-1 ${valueStyles}`}>
              {selectedStudent.attendance?.percentage || 0}%
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
          }`}>
            📊
          </div>
        </div>
        
        <div className={statCardStyles('yellow', 'text-yellow-600', 'text-yellow-400')}>
          <div>
            <p className={labelStyles}>Discipline</p>
            <p className={`text-2xl font-bold mt-1 ${valueStyles}`}>
              {selectedStudent.disciplineScore || 100}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
          }`}>
            ⭐
          </div>
        </div>
      </div>

      {/* Academic Stats */}
      <div className={cardStyles}>
        <h4 className={headingStyles}>Academic Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelStyles}>Achievements</label>
            <p className={`mt-1 text-lg font-semibold ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`}>
              🏅 {selectedStudent.achievements || 0} Awards
            </p>
          </div>
          <div>
            <label className={labelStyles}>Incidents</label>
            <p className={`mt-1 text-lg font-semibold ${
              theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
            }`}>
              ⚠️ {selectedStudent.incidents || 0} Records
            </p>
          </div>
          <div>
            <label className={labelStyles}>Admission Date</label>
            <p className={valueStyles}>
              {selectedStudent.admissionDate || selectedStudent.enrollmentDate || 'N/A'}
            </p>
          </div>
          <div>
            <label className={labelStyles}>Academic Year</label>
            <p className={valueStyles}>
              {selectedStudent.academicYear || 'N/A'}
            </p>
          </div>
        </div>
        {selectedStudent.remarks && (
          <div className="mt-4">
            <label className={labelStyles}>Remarks</label>
            <p className={valueStyles}>{selectedStudent.remarks}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicsTab;
