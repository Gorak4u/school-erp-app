import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Student, ActionButton } from './types';
import Button from './ui/Button';
import {
  Smartphone,
  IdCard,
  Printer,
  Pencil,
  ArrowUp,
  ChevronDown,
  Settings
} from 'lucide-react';

interface ProfileHeaderProps {
  selectedStudent: Student;
  theme: 'dark' | 'light';
  actions: ActionButton[];
  canEditStudentRecord: boolean;
}

// Icon mapping for dynamic rendering
const iconComponents: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Smartphone,
  IdCard,
  Printer,
  Pencil,
  ArrowUp,
  Settings
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  selectedStudent,
  theme,
  actions,
  canEditStudentRecord
}) => {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleButtonClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Use button width for dropdown
      const dropdownWidth = rect.width;
      
      // Calculate left position to align with button left edge
      let leftPosition = rect.left;
      
      // Ensure dropdown stays within viewport on the left side
      if (leftPosition < 8) {
        leftPosition = 8;
      }
      
      // Ensure dropdown stays within viewport on the right side
      if (leftPosition + dropdownWidth > viewportWidth - 8) {
        leftPosition = viewportWidth - dropdownWidth - 8;
      }
      
      // Calculate top position (below button)
      let topPosition = rect.bottom + 8;
      const dropdownHeight = 300; // Approximate height
      
      // If dropdown would go below viewport, show it above the button
      if (rect.bottom + dropdownHeight + 8 > viewportHeight) {
        topPosition = rect.top - dropdownHeight - 8;
      }
      
      setDropdownPosition({
        top: topPosition,
        left: leftPosition,
        width: dropdownWidth
      });
    }
    setIsQuickActionsOpen(!isQuickActionsOpen);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="px-4 py-0 backdrop-blur-sm bg-white/5 border-b border-white/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Student Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5">
              <div className="w-full h-full rounded-xl overflow-hidden backdrop-blur-sm bg-white/10 flex items-center justify-center">
                {selectedStudent.photo ? (
                  <img
                    src={selectedStudent.photo}
                    alt={selectedStudent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedStudent.name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Avatar glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 blur-md -z-10" />
          </motion.div>

          {/* Student Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-1"
          >
            <h2 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400`}>
              {selectedStudent.name}
            </h2>
            <div className="flex items-center space-x-4 text-sm">
              <span className={`backdrop-blur-sm px-3 py-1 rounded-full border ${
                theme === 'dark' 
                  ? 'bg-white/20 border-white/30 text-white' 
                  : 'bg-white/80 border-white/40 text-gray-800'
              }`}>
                {selectedStudent.admissionNo}
              </span>
              <span className={`backdrop-blur-sm px-3 py-1 rounded-full border ${
                theme === 'dark' 
                  ? 'bg-white/20 border-white/30 text-white' 
                  : 'bg-white/80 border-white/40 text-gray-800'
              }`}>
                {selectedStudent.class}{selectedStudent.section ? ` - ${selectedStudent.section}` : ''}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions Dropdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative"
        >
          {/* Quick Actions Button */}
          <motion.button
            ref={buttonRef}
            onClick={handleButtonClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-4 h-4" />
            <span>Quick Actions</span>
            <motion.div
              animate={{ rotate: isQuickActionsOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>

          {/* Portal Dropdown */}
          {isQuickActionsOpen && createPortal(
            <AnimatePresence>
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[999999]"
                  onClick={() => setIsQuickActionsOpen(false)}
                />
                
                {/* Dropdown Content */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'fixed',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    zIndex: 1000000,
                    transform: 'translateZ(0)'
                  }}
                  className={`rounded-xl shadow-2xl border overflow-hidden ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Dropdown Header */}
                  <div className={`px-4 py-3 border-b ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className={`text-sm font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Student Actions
                    </div>
                    <div className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {selectedStudent.name}
                    </div>
                  </div>

                  {/* Action Items */}
                  <div className="py-2">
                    {actions.map((action, index) => {
                      const IconComponent = iconComponents[action.icon];
                      return (
                        <motion.button
                          key={action.label}
                          onClick={() => {
                            action.onClick();
                            setIsQuickActionsOpen(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-gray-700 text-gray-200' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                          whileHover={{ x: 4 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <div className={`p-2 rounded-lg ${
                            action.variant === 'primary' 
                              ? theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                              : theme === 'dark' ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {action.label}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Dropdown Footer */}
                  <div className={`px-4 py-2 border-t ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className={`text-xs ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      Press ESC to close
                    </div>
                  </div>
                </motion.div>
              </>
            </AnimatePresence>,
            document.body
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
