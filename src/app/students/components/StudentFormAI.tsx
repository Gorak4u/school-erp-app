'use client';

import React from 'react';
import StudentFormAIContainer from './ai-form/StudentFormAIContainer';
import { StudentFormAIProps } from './ai-form/types';

const StudentFormAI: React.FC<StudentFormAIProps> = (props) => {
  return <StudentFormAIContainer {...props} />;
};

export default StudentFormAI;
