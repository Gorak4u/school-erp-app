import React from 'react';
import { motion } from 'framer-motion';
import { Student, ActionButton } from './types';
import Button from './ui/Button';
import {
  Smartphone,
  IdCard,
  Printer,
  Pencil,
  ArrowUp
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
  ArrowUp
};

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
          {actions.map((action, index) => {
            const IconComponent = iconComponents[action.icon];
            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <Button
                  variant={action.variant}
                  size="md"
                  icon={IconComponent}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
