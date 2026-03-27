import { useState, useCallback } from 'react';
import { AIInsights, StudentFormData } from '../types';

export const useAIFormProcessor = () => {
  const [aiInsights, setAiInsights] = useState<AIInsights>({
    confidence: 0,
    suggestions: [],
    warnings: [],
    recommendations: [],
    processingTime: 0
  });

  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const processWithAI = useCallback(async (data: StudentFormData) => {
    setIsAIProcessing(true);
    const startTime = Date.now();
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate dynamic suggestions based on form data
      const suggestions = [];
      const warnings = [];
      const recommendations = [];
      
      if (!data.photo) suggestions.push('Upload a recent photograph for ID card');
      if (!data.emergencyContact) suggestions.push('Add emergency contact information');
      if (!data.medicalConditions) suggestions.push('Provide medical information for school records');
      if (!data.bloodGroup) suggestions.push('Specify blood group for medical emergencies');
      if (!data.aadharNumber) suggestions.push('Add Aadhar number for official records');
      
      // Dynamic warnings
      if (data.phone && data.phone.length !== 10) warnings.push('Phone number appears to be invalid');
      if (data.email && !data.email.includes('@')) warnings.push('Email address format appears incorrect');
      if (data.aadharNumber && data.aadharNumber.length !== 12) warnings.push('Aadhar number should be 12 digits');
      
      // Dynamic recommendations
      if (data.name && data.name.length < 3) recommendations.push('Consider verifying the student name format');
      if (data.address && data.address.length < 10) recommendations.push('Add more detailed address information');
      if (!data.fatherName && !data.motherName) recommendations.push('Add at least one parent information');
      
      const insights: AIInsights = {
        confidence: Math.min(95, 60 + (suggestions.length * 5) + Math.random() * 20),
        suggestions,
        warnings,
        recommendations,
        processingTime: Date.now() - startTime
      };
      
      setAiInsights(insights);
    } catch (error) {
      console.error('AI processing failed:', error);
    } finally {
      setIsAIProcessing(false);
    }
  }, []);

  return {
    aiInsights,
    isAIProcessing,
    processWithAI
  };
};
