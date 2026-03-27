import { useState, useCallback, useEffect } from 'react';
import { StudentFormData } from '../types';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { buildStudentIdCardSnippet, buildStudentIdCardDocument, StudentIdCardData as LibraryStudentIdCardData } from '@/lib/idCard';

// Use the library's StudentIdCardData type instead of our own
export type StudentIdCardData = LibraryStudentIdCardData;

export const useIdCard = (formData: StudentFormData, activeAcademicYear: any, transportInfo: any) => {
  const { getSetting } = useSchoolConfig();
  const [showIdCard, setShowIdCard] = useState(false);
  const [showCardBack, setShowCardBack] = useState(false);
  const [idCardHtml, setIdCardHtml] = useState('');
  const [idCardData, setIdCardData] = useState<StudentIdCardData | null>(null);

  // Generate ID card data from form data - Matching library's interface
  const generateIdCardData = useCallback((studentData?: Partial<StudentFormData>): StudentIdCardData => {
    const data = studentData || formData;
    
    return {
      name: data.name || '',
      admissionNo: data.admissionNo || '',
      className: [data.class, data.section].filter(Boolean).join(' - '),
      schoolName: getSetting('school_details', 'name', 'Our School'),
      schoolLogo: getSetting('school_details', 'logo_url', ''),
      photo: data.photo || '',
      dateOfBirth: data.dateOfBirth || '',
      issueDate: data.admissionDate || new Date().toISOString().split('T')[0],
      phone: data.phone || '',
      address: data.address || '',
      academicYear: activeAcademicYear?.name || activeAcademicYear?.year,
      bloodGroup: data.bloodGroup || '',
      fatherName: data.fatherName || '',
      motherName: data.motherName || '',
      transportRoute: data.transport === 'Yes' && transportInfo.routeId ? transportInfo.routeName || `Route ${transportInfo.routeNumber}` : undefined,
    };
  }, [formData, getSetting, activeAcademicYear, transportInfo]);

  // Generate ID card HTML - Using same library as old form
  const generateIdCardHtml = useCallback(async (data: StudentIdCardData, back: boolean = false) => {
    return await buildStudentIdCardSnippet(data, back);
  }, []);

  // Generate ID card document HTML - Using same library as old form
  const generateIdCardDocument = useCallback(async (data: StudentIdCardData, back: boolean = false) => {
    return await buildStudentIdCardDocument(data, back);
  }, []);

  // Generate ID card HTML when side changes
  useEffect(() => {
    if (showIdCard && idCardData) {
      const generateHtml = async () => {
        const html = await generateIdCardHtml(idCardData, showCardBack);
        setIdCardHtml(html);
      };
      generateHtml();
    }
  }, [showIdCard, showCardBack, idCardData, generateIdCardHtml]);

  // Handle ID card generation
  const handleGenerateIdCard = useCallback((studentOverride?: Partial<StudentFormData>) => {
    const data = generateIdCardData(studentOverride);
    setIdCardData(data);
    setShowIdCard(true);
    setShowCardBack(false);
  }, [generateIdCardData]);

  // Handle ID card printing - Using same library as old form
  const handlePrintIdCard = useCallback(async () => {
    if (!idCardData) return;
    
    const html = await buildStudentIdCardDocument(idCardData, showCardBack);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }, [idCardData, showCardBack]);

  // Handle switching card sides
  const handleToggleCardSide = useCallback(() => {
    setShowCardBack(prev => !prev);
  }, []);

  return {
    showIdCard,
    setShowIdCard,
    showCardBack,
    setShowCardBack,
    idCardHtml,
    idCardData,
    setIdCardData,
    setIdCardHtml,
    handleGenerateIdCard,
    handlePrintIdCard,
    handleToggleCardSide,
  };
};
