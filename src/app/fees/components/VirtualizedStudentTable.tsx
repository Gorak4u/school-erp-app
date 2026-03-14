import React from 'react';

interface VirtualizedStudentTableProps {
  students: any[];
  theme: 'dark' | 'light';
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
  onStudentSelect?: (studentId: string) => void;
  selectedStudents: string[];
  onBulkSelect?: (studentIds: string[]) => void;
}

const SimpleStudentTable: React.FC<VirtualizedStudentTableProps> = ({
  students,
  theme,
  onLoadMore,
  hasNextPage = false,
  isLoading = false,
  onStudentSelect,
  selectedStudents,
  onBulkSelect
}) => {
  const handleSelectAll = () => {
    if (onBulkSelect) {
      const allStudentIds = students.map(s => s.studentId);
      onBulkSelect(allStudentIds);
    }
  };

  const handleClearSelection = () => {
    if (onBulkSelect) {
      onBulkSelect([]);
    }
  };

  if (students.length === 0) {
    return (
      <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        <div className="text-6xl mb-4">👥</div>
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          No Students Found
        </h3>
        <p className="mt-2">
          Try adjusting your filters or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="simple-student-table">
      {/* Header with bulk actions */}
      <div className={`px-6 py-3 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedStudents.length === students.length && students.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  handleSelectAll();
                } else {
                  handleClearSelection();
                }
              }}
              className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''
              }`}
            />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {selectedStudents.length} of {students.length} selected
            </span>
          </div>
          
          {selectedStudents.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearSelection}
                className={`text-sm px-3 py-1 rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simple table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Total Fees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Paid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Pending
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {students.map((student) => (
              <tr 
                key={student.studentId}
                className={`hover:${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} cursor-pointer`}
                onClick={() => onStudentSelect?.(student.studentId)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.studentId)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onStudentSelect?.(student.studentId);
                      }}
                      className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium">
                        {student.studentName}
                      </div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {student.admissionNo}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.studentClass} - {student.rollNo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  ₹{student.totalFees.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  ₹{student.totalPaid.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                  ₹{student.totalPending.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.calculatedPaymentStatus === 'fully_paid' ? 'bg-green-100 text-green-800' :
                    student.calculatedPaymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                    student.calculatedPaymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {student.calculatedPaymentStatus?.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading more students...
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`px-6 py-3 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between text-sm">
          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Showing {students.length} students
          </span>
          {hasNextPage && (
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Export SimpleStudentTable as VirtualizedStudentTable for compatibility
const VirtualizedStudentTable = SimpleStudentTable;

export default VirtualizedStudentTable;
