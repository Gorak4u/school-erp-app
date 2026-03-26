import React from 'react';
import { motion } from 'framer-motion';
import { Student, ActionButton } from './types';

interface ProfileHeaderProps {
  selectedStudent: Student;
  theme: 'dark' | 'light';
  actions: ActionButton[];
  canEditStudentRecord: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  selectedStudent,
  theme,
  actions,
  canEditStudentRecord
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="px-6 py-4 backdrop-blur-sm bg-white/5 border-b border-white/10"
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5">
              <div className="w-full h-full rounded-2xl overflow-hidden backdrop-blur-sm bg-white/10 flex items-center justify-center">
                {selectedStudent.photo ? (
                  <img
                    src={selectedStudent.photo}
                    alt={selectedStudent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedStudent.name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Avatar glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 blur-md -z-10" />
          </motion.div>

          {/* Student Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-1"
          >
            <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400`}>
              {selectedStudent.name}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-white/70">
              <span className="backdrop-blur-sm bg-white/10 px-3 py-1 rounded-full border border-white/20">
                {selectedStudent.admissionNo}
              </span>
              <span className="backdrop-blur-sm bg-white/10 px-3 py-1 rounded-full border border-white/20">
                {selectedStudent.class}{selectedStudent.section ? ` - ${selectedStudent.section}` : ''}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center space-x-3"
        >
          {actions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className={`relative overflow-hidden px-4 py-2.5 rounded-2xl font-medium text-sm transition-all duration-300 ${
                action.variant === 'primary'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'backdrop-blur-sm bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {action.icon}
                {action.label}
              </span>
              {/* Hover effect for primary buttons */}
              {action.variant === 'primary' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "0%" }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
