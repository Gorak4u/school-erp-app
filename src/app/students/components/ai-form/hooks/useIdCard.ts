import { useState, useCallback, useEffect } from 'react';
import { StudentFormData } from '../types';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

export interface StudentIdCardData {
  name: string;
  admissionNo: string;
  className: string;
  rollNumber: string;
  photo: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export const useIdCard = (formData: StudentFormData) => {
  const { getSetting } = useSchoolConfig();
  const [showIdCard, setShowIdCard] = useState(false);
  const [showCardBack, setShowCardBack] = useState(false);
  const [idCardHtml, setIdCardHtml] = useState('');
  const [idCardData, setIdCardData] = useState<StudentIdCardData | null>(null);

  // Generate ID card data from form data
  const generateIdCardData = useCallback((studentData?: Partial<StudentFormData>): StudentIdCardData => {
    const data = studentData || formData;
    
    return {
      name: data.name || '',
      admissionNo: data.admissionNo || '',
      className: [data.classId, data.sectionId].filter(Boolean).join(' - '),
      rollNumber: data.rollNumber || '',
      photo: data.photo || '',
      dateOfBirth: data.dateOfBirth || '',
      bloodGroup: data.bloodGroup || '',
      address: data.address || '',
      phone: data.phone || '',
      emergencyContact: data.emergencyContact || '',
      emergencyPhone: data.emergencyPhone || '',
    };
  }, [formData]);

  // Generate ID card HTML
  const generateIdCardHtml = useCallback(async (data: StudentIdCardData, back: boolean = false) => {
    const schoolName = getSetting('school_details', 'name', 'School Name');
    const schoolLogo = getSetting('school_details', 'logo_url', '');
    const schoolAddress = getSetting('school_details', 'address', 'School Address');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Student ID Card</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .id-card { 
            width: 350px; 
            height: 200px; 
            border: 2px solid #333; 
            border-radius: 10px; 
            padding: 15px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            position: relative;
            overflow: hidden;
          }
          .id-card::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: rgba(255,255,255,0.1);
            transform: rotate(45deg);
          }
          .school-header { text-align: center; margin-bottom: 10px; }
          .school-name { font-size: 14px; font-weight: bold; margin: 0; }
          .card-content { display: flex; gap: 15px; }
          .photo-section { width: 80px; }
          .student-photo { 
            width: 80px; 
            height: 100px; 
            border: 2px solid white; 
            border-radius: 5px; 
            background: white;
            object-fit: cover;
          }
          .info-section { flex: 1; font-size: 10px; }
          .info-row { margin: 2px 0; display: flex; justify-content: space-between; }
          .info-label { font-weight: bold; }
          .barcode { 
            position: absolute; 
            bottom: 10px; 
            right: 10px; 
            font-family: monospace; 
            font-size: 8px;
            transform: rotate(-90deg);
            transform-origin: right bottom;
          }
        </style>
      </head>
      <body>
        <div class="id-card">
          <div class="school-header">
            <div class="school-name">${schoolName}</div>
          </div>
          <div class="card-content">
            <div class="photo-section">
              ${data.photo ? 
                `<img src="${data.photo}" alt="Student Photo" class="student-photo" />` :
                `<div class="student-photo" style="display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666;">
                  <div style="text-align: center; font-size: 8px;">NO<br>PHOTO</div>
                </div>`
              }
            </div>
            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span>${data.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Adm No:</span>
                <span>${data.admissionNo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Class:</span>
                <span>${data.className}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Roll:</span>
                <span>${data.rollNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">DOB:</span>
                <span>${data.dateOfBirth}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Blood:</span>
                <span>${data.bloodGroup}</span>
              </div>
            </div>
          </div>
          ${back ? `
            <div style="margin-top: 10px; font-size: 9px;">
              <div style="margin-bottom: 5px;"><strong>Address:</strong> ${data.address}</div>
              <div style="margin-bottom: 5px;"><strong>Phone:</strong> ${data.phone}</div>
              <div style="margin-bottom: 5px;"><strong>Emergency:</strong> ${data.emergencyContact} (${data.emergencyPhone})</div>
            </div>
          ` : ''}
          <div class="barcode">${data.admissionNo}</div>
        </div>
      </body>
      </html>
    `;
    
    return html;
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

  // Handle ID card printing
  const handlePrintIdCard = useCallback(async () => {
    if (!idCardData) return;
    
    const html = await generateIdCardHtml(idCardData, showCardBack);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }, [idCardData, showCardBack, generateIdCardHtml]);

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
