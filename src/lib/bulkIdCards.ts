// @ts-nocheck
import { buildStudentIdCardDocument, StudentIdCardData } from './idCard';
import { buildTeacherIdCardDocument, TeacherIdCardData } from './teacherIdCard';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface BulkIdCardOptions {
  outputFormat: 'pdf' | 'image' | 'both';
  layout: 'grid' | 'individual' | 'compact';
  includeBothSides: boolean;
}

export interface BulkIdCardResult {
  pdf?: Uint8Array;
  images?: { [key: string]: Uint8Array };
  summary: {
    totalStudents: number;
    format: string;
    layout: string;
    includeBothSides: boolean;
  };
}

export async function generateBulkIdCards(
  students: any[],
  options: BulkIdCardOptions,
  schoolConfig: any
): Promise<BulkIdCardResult> {
  const { outputFormat, layout, includeBothSides } = options;
  
  // Generate ID card data for all students
  const idCards: StudentIdCardData[] = students.map(student => ({
    name: student.name,
    admissionNo: student.admissionNo,
    className: `${student.class}${student.section ? ` - ${student.section}` : ''}`,
    schoolName: schoolConfig.getSetting('school_details', 'name', 'School Name'),
    schoolLogo: schoolConfig.getSetting('school_details', 'logo_url', ''),
    photo: student.photo,
    dateOfBirth: student.dateOfBirth,
    issueDate: new Date().toISOString().split('T')[0],
    academicYear: student.academicYear || '2024-25',
    bloodGroup: student.bloodGroup,
    fatherName: student.fatherName,
    motherName: student.motherName,
    transportRoute: student.transportRoute,
    phone: student.phone
  }));

  const result: BulkIdCardResult = {
    summary: {
      totalStudents: students.length,
      format: outputFormat,
      layout,
      includeBothSides
    }
  };

  if (outputFormat === 'pdf' || outputFormat === 'both') {
    result.pdf = await generateBulkPDF(idCards, layout, includeBothSides);
  }

  if (outputFormat === 'image' || outputFormat === 'both') {
    result.images = await generateBulkImages(idCards, layout, includeBothSides);
  }

  return result;
}

async function generateBulkPDF(
  idCards: StudentIdCardData[],
  layout: string,
  includeBothSides: boolean
): Promise<Uint8Array> {
  const pdf = new jsPDF({
    orientation: layout === 'individual' ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: false
  });

  if (layout === 'grid') {
    await generateGridLayoutPDF(pdf, idCards, includeBothSides);
  } else if (layout === 'individual') {
    await generateIndividualLayoutPDF(pdf, idCards, includeBothSides);
  } else if (layout === 'compact') {
    await generateCompactLayoutPDF(pdf, idCards, includeBothSides);
  }

  return new Uint8Array(pdf.output('arraybuffer'));
}

async function generateGridLayoutPDF(
  pdf: jsPDF,
  idCards: StudentIdCardData[],
  includeBothSides: boolean
): Promise<void> {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const cardWidth = 85; // mm
  const cardHeight = 55; // mm
  const padding = 10; // mm
  const cardsPerRow = Math.floor((pageWidth - padding * 2) / cardWidth);
  const cardsPerColumn = Math.floor((pageHeight - padding * 2) / cardHeight);

  let currentPage = 0;
  let cardIndex = 0;

  while (cardIndex < idCards.length) {
    if (currentPage > 0) {
      pdf.addPage();
    }
    currentPage++;

    for (let row = 0; row < cardsPerColumn && cardIndex < idCards.length; row++) {
      for (let col = 0; col < cardsPerRow && cardIndex < idCards.length; col++) {
        const x = padding + col * cardWidth;
        const y = padding + row * cardHeight;
        
        // Generate card HTML
        const cardHtml = await buildStudentIdCardDocument(idCards[cardIndex], false);
        
        // Create a temporary div to render the card
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtml;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '325px';
        document.body.appendChild(tempDiv);

        try {
          // Convert to canvas with enhanced quality and contrast
          const canvas = await html2canvas(tempDiv, {
            scale: 4, // Even higher scale for maximum quality
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            ignoreElements: (el) => el.tagName === 'SCRIPT' || el.tagName === 'STYLE',
            onclone: (clonedDoc) => {
              // Enhance colors in the cloned document for better contrast
              const elements = clonedDoc.querySelectorAll('*');
              elements.forEach(el => {
                const computedStyle = window.getComputedStyle(el);
                const htmlEl = el as HTMLElement;
                
                // Fix any lab() color functions
                if (computedStyle.background?.includes('lab(')) {
                  htmlEl.style.background = '#0f172a';
                }
                if (computedStyle.backgroundColor?.includes('lab(')) {
                  htmlEl.style.backgroundColor = '#0f172a';
                }
                if (computedStyle.color?.includes('lab(')) {
                  htmlEl.style.color = '#f1f5f9';
                }
                
                // Enhance contrast for better quality
                if (htmlEl.style.background === '#1f2937') {
                  htmlEl.style.background = '#0f172a'; // Much darker for better contrast
                }
                if (htmlEl.style.backgroundColor === '#1f2937') {
                  htmlEl.style.backgroundColor = '#0f172a';
                }
                if (htmlEl.style.background === '#2563eb') {
                  htmlEl.style.background = '#1e40af'; // Darker blue for better contrast
                }
                if (htmlEl.style.backgroundColor === '#2563eb') {
                  htmlEl.style.backgroundColor = '#1e40af';
                }
                
                // Enhance text colors for better readability
                if (htmlEl.style.color === '#e2e8f0') {
                  htmlEl.style.color = '#f1f5f9'; // Lighter text for better contrast
                }
                if (htmlEl.style.color === '#94a3b8') {
                  htmlEl.style.color = '#cbd5e1'; // Lighter secondary text
                }
                if (htmlEl.style.color === '#f8fafc') {
                  htmlEl.style.color = '#ffffff'; // Pure white for headers
                }
                if (htmlEl.style.color === '#93c5fd') {
                  htmlEl.style.color = '#dbeafe'; // Lighter blue text
                }
                if (htmlEl.style.color === '#86efac') {
                  htmlEl.style.color = '#bbf7d0'; // Lighter green text
                }
                if (htmlEl.style.color === '#fbbf24') {
                  htmlEl.style.color = '#fde68a'; // Lighter yellow text
                }
              });
            }
          });

          // Add to PDF
          const imgData = canvas.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);

          // Add back side if needed
          if (includeBothSides && cardIndex < idCards.length) {
            const backHtml = await buildStudentIdCardDocument(idCards[cardIndex], true);
            tempDiv.innerHTML = backHtml;
            
            const backCanvas = await html2canvas(tempDiv, {
              scale: 4, // Even higher scale for maximum quality
              backgroundColor: '#ffffff',
              useCORS: true,
              allowTaint: true,
              ignoreElements: (el) => el.tagName === 'SCRIPT' || el.tagName === 'STYLE',
              onclone: (clonedDoc) => {
                // Enhance colors in the cloned document for better contrast
                const elements = clonedDoc.querySelectorAll('*');
                elements.forEach(el => {
                  const computedStyle = window.getComputedStyle(el);
                  const htmlEl = el as HTMLElement;
                  
                  // Fix any lab() color functions
                  if (computedStyle.background?.includes('lab(')) {
                    htmlEl.style.background = '#0f172a';
                  }
                  if (computedStyle.backgroundColor?.includes('lab(')) {
                    htmlEl.style.backgroundColor = '#0f172a';
                  }
                  if (computedStyle.color?.includes('lab(')) {
                    htmlEl.style.color = '#f1f5f9';
                  }
                  
                  // Enhance contrast for better quality
                  if (htmlEl.style.background === '#1f2937') {
                    htmlEl.style.background = '#0f172a'; // Much darker for better contrast
                  }
                  if (htmlEl.style.backgroundColor === '#1f2937') {
                    htmlEl.style.backgroundColor = '#0f172a';
                  }
                  if (htmlEl.style.background === '#2563eb') {
                    htmlEl.style.background = '#1e40af'; // Darker blue for better contrast
                  }
                  if (htmlEl.style.backgroundColor === '#2563eb') {
                    htmlEl.style.backgroundColor = '#1e40af';
                  }
                  
                  // Enhance text colors for better readability
                  if (htmlEl.style.color === '#e2e8f0') {
                    htmlEl.style.color = '#f1f5f9'; // Lighter text for better contrast
                  }
                  if (htmlEl.style.color === '#94a3b8') {
                    htmlEl.style.color = '#cbd5e1'; // Lighter secondary text
                  }
                  if (htmlEl.style.color === '#f8fafc') {
                    htmlEl.style.color = '#ffffff'; // Pure white for headers
                  }
                  if (htmlEl.style.color === '#93c5fd') {
                    htmlEl.style.color = '#dbeafe'; // Lighter blue text
                  }
                  if (htmlEl.style.color === '#86efac') {
                    htmlEl.style.color = '#bbf7d0'; // Lighter green text
                  }
                  if (htmlEl.style.color === '#fbbf24') {
                    htmlEl.style.color = '#fde68a'; // Lighter yellow text
                  }
                });
              }
            });

            const backImgData = backCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(backImgData, 'PNG', x + cardWidth + 2, y, cardWidth, cardHeight);
          }
        } finally {
          document.body.removeChild(tempDiv);
        }

        cardIndex++;
      }
    }
  }
}

async function generateIndividualLayoutPDF(
  pdf: jsPDF,
  idCards: StudentIdCardData[],
  includeBothSides: boolean
): Promise<void> {
  for (let i = 0; i < idCards.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    // Generate front side
    const frontHtml = await buildStudentIdCardDocument(idCards[i], false);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = frontHtml;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '325px';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        ignoreElements: (el) => el.tagName === 'SCRIPT' || el.tagName === 'STYLE'
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = 180; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 15, 20, imgWidth, imgHeight);

      // Add back side if needed
      if (includeBothSides) {
        const backHtml = await buildStudentIdCardDocument(idCards[i], true);
        tempDiv.innerHTML = backHtml;
        
        const backCanvas = await html2canvas(tempDiv, {
          scale: 4, // Even higher scale for maximum quality
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          ignoreElements: (el) => el.tagName === 'SCRIPT' || el.tagName === 'STYLE',
          onclone: (clonedDoc) => {
            // Enhance colors in the cloned document for better contrast
            const elements = clonedDoc.querySelectorAll('*');
            elements.forEach(el => {
              const computedStyle = window.getComputedStyle(el);
              const htmlEl = el as HTMLElement;
              
              // Fix any lab() color functions
              if (computedStyle.background?.includes('lab(')) {
                htmlEl.style.background = '#0f172a';
              }
              if (computedStyle.backgroundColor?.includes('lab(')) {
                htmlEl.style.backgroundColor = '#0f172a';
              }
              if (computedStyle.color?.includes('lab(')) {
                htmlEl.style.color = '#f1f5f9';
              }
              
              // Enhance contrast for better quality
              if (htmlEl.style.background === '#1f2937') {
                htmlEl.style.background = '#0f172a'; // Much darker for better contrast
              }
              if (htmlEl.style.backgroundColor === '#1f2937') {
                htmlEl.style.backgroundColor = '#0f172a';
              }
              if (htmlEl.style.background === '#2563eb') {
                htmlEl.style.background = '#1e40af'; // Darker blue for better contrast
              }
              if (htmlEl.style.backgroundColor === '#2563eb') {
                htmlEl.style.backgroundColor = '#1e40af';
              }
              
              // Enhance text colors for better readability
              if (htmlEl.style.color === '#e2e8f0') {
                htmlEl.style.color = '#f1f5f9'; // Lighter text for better contrast
              }
              if (htmlEl.style.color === '#94a3b8') {
                htmlEl.style.color = '#cbd5e1'; // Lighter secondary text
              }
              if (htmlEl.style.color === '#f8fafc') {
                htmlEl.style.color = '#ffffff'; // Pure white for headers
              }
              if (htmlEl.style.color === '#93c5fd') {
                htmlEl.style.color = '#dbeafe'; // Lighter blue text
              }
              if (htmlEl.style.color === '#86efac') {
                htmlEl.style.color = '#bbf7d0'; // Lighter green text
              }
              if (htmlEl.style.color === '#fbbf24') {
                htmlEl.style.color = '#fde68a'; // Lighter yellow text
              }
            });
          }
        });

        const backImgData = backCanvas.toDataURL('image/png', 1.0);
        pdf.addImage(backImgData, 'PNG', 15, imgHeight + 30, imgWidth, imgHeight);
      }
    } finally {
      document.body.removeChild(tempDiv);
    }
  }
}

async function generateCompactLayoutPDF(
  pdf: jsPDF,
  idCards: StudentIdCardData[],
  includeBothSides: boolean
): Promise<void> {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const cardWidth = 60; // mm - smaller for compact
  const cardHeight = 40; // mm - smaller for compact
  const padding = 8; // mm
  const cardsPerRow = Math.floor((pageWidth - padding * 2) / cardWidth);
  const cardsPerColumn = Math.floor((pageHeight - padding * 2) / cardHeight);

  let currentPage = 0;
  let cardIndex = 0;

  while (cardIndex < idCards.length) {
    if (currentPage > 0) {
      pdf.addPage();
    }
    currentPage++;

    for (let row = 0; row < cardsPerColumn && cardIndex < idCards.length; row++) {
      for (let col = 0; col < cardsPerRow && cardIndex < idCards.length; col++) {
        const x = padding + col * cardWidth;
        const y = padding + row * cardHeight;
        
        // Generate card HTML
        const cardHtml = await buildStudentIdCardDocument(idCards[cardIndex], false);
        
        // Create a temporary div to render the card
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtml;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '325px';
        document.body.appendChild(tempDiv);

        try {
          // Convert to canvas with enhanced quality and contrast
          const canvas = await html2canvas(tempDiv, {
            scale: 4, // Even higher scale for maximum quality
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            ignoreElements: (el) => el.tagName === 'SCRIPT' || el.tagName === 'STYLE',
            onclone: (clonedDoc) => {
              // Enhance colors in the cloned document for better contrast
              const elements = clonedDoc.querySelectorAll('*');
              elements.forEach(el => {
                const computedStyle = window.getComputedStyle(el);
                const htmlEl = el as HTMLElement;
                
                // Fix any lab() color functions
                if (computedStyle.background?.includes('lab(')) {
                  htmlEl.style.background = '#0f172a';
                }
                if (computedStyle.backgroundColor?.includes('lab(')) {
                  htmlEl.style.backgroundColor = '#0f172a';
                }
                if (computedStyle.color?.includes('lab(')) {
                  htmlEl.style.color = '#f1f5f9';
                }
                
                // Enhance contrast for better quality
                if (htmlEl.style.background === '#1f2937') {
                  htmlEl.style.background = '#0f172a'; // Much darker for better contrast
                }
                if (htmlEl.style.backgroundColor === '#1f2937') {
                  htmlEl.style.backgroundColor = '#0f172a';
                }
                if (htmlEl.style.background === '#2563eb') {
                  htmlEl.style.background = '#1e40af'; // Darker blue for better contrast
                }
                if (htmlEl.style.backgroundColor === '#2563eb') {
                  htmlEl.style.backgroundColor = '#1e40af';
                }
                
                // Enhance text colors for better readability
                if (htmlEl.style.color === '#e2e8f0') {
                  htmlEl.style.color = '#f1f5f9'; // Lighter text for better contrast
                }
                if (htmlEl.style.color === '#94a3b8') {
                  htmlEl.style.color = '#cbd5e1'; // Lighter secondary text
                }
                if (htmlEl.style.color === '#f8fafc') {
                  htmlEl.style.color = '#ffffff'; // Pure white for headers
                }
                if (htmlEl.style.color === '#93c5fd') {
                  htmlEl.style.color = '#dbeafe'; // Lighter blue text
                }
                if (htmlEl.style.color === '#86efac') {
                  htmlEl.style.color = '#bbf7d0'; // Lighter green text
                }
                if (htmlEl.style.color === '#fbbf24') {
                  htmlEl.style.color = '#fde68a'; // Lighter yellow text
                }
              });
            }
          });

          // Add to PDF
          const imgData = canvas.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
        } finally {
          document.body.removeChild(tempDiv);
        }

        cardIndex++;
      }
    }
  }
}

async function generateBulkImages(
  idCards: StudentIdCardData[],
  layout: string,
  includeBothSides: boolean
): Promise<{ [key: string]: Uint8Array }> {
  const images: { [key: string]: Uint8Array } = {};

  for (let i = 0; i < idCards.length; i++) {
    const student = idCards[i];
    
    // Generate front side
    const frontHtml = await buildStudentIdCardDocument(student, false);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = frontHtml;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '325px';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 4, // Even higher scale for maximum quality
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        ignoreElements: (el) => el.tagName === 'SCRIPT' || el.tagName === 'STYLE',
        onclone: (clonedDoc) => {
          // Enhance colors in the cloned document for better contrast
          const elements = clonedDoc.querySelectorAll('*');
          elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const htmlEl = el as HTMLElement;
            
            // Fix any lab() color functions
            if (computedStyle.background?.includes('lab(')) {
              htmlEl.style.background = '#0f172a';
            }
            if (computedStyle.backgroundColor?.includes('lab(')) {
              htmlEl.style.backgroundColor = '#0f172a';
            }
            if (computedStyle.color?.includes('lab(')) {
              htmlEl.style.color = '#f1f5f9';
            }
            
            // Enhance contrast for better quality
            if (htmlEl.style.background === '#1f2937') {
              htmlEl.style.background = '#0f172a'; // Much darker for better contrast
            }
            if (htmlEl.style.backgroundColor === '#1f2937') {
              htmlEl.style.backgroundColor = '#0f172a';
            }
            if (htmlEl.style.background === '#2563eb') {
              htmlEl.style.background = '#1e40af'; // Darker blue for better contrast
            }
            if (htmlEl.style.backgroundColor === '#2563eb') {
              htmlEl.style.backgroundColor = '#1e40af';
            }
            
            // Enhance text colors for better readability
            if (htmlEl.style.color === '#e2e8f0') {
              htmlEl.style.color = '#f1f5f9'; // Lighter text for better contrast
            }
            if (htmlEl.style.color === '#94a3b8') {
              htmlEl.style.color = '#cbd5e1'; // Lighter secondary text
            }
            if (htmlEl.style.color === '#f8fafc') {
              htmlEl.style.color = '#ffffff'; // Pure white for headers
            }
            if (htmlEl.style.color === '#93c5fd') {
              htmlEl.style.color = '#dbeafe'; // Lighter blue text
            }
            if (htmlEl.style.color === '#86efac') {
              htmlEl.style.color = '#bbf7d0'; // Lighter green text
            }
            if (htmlEl.style.color === '#fbbf24') {
              htmlEl.style.color = '#fde68a'; // Lighter yellow text
            }
          });
        }
      });

      // Convert to blob and then to Uint8Array
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
      });

      const arrayBuffer = await blob.arrayBuffer();
      images[`${student.admissionNo}_front.png`] = new Uint8Array(arrayBuffer);

      // Generate back side if needed
      if (includeBothSides) {
        const backHtml = await buildStudentIdCardDocument(student, true);
        tempDiv.innerHTML = backHtml;
        
        const backCanvas = await html2canvas(tempDiv, {
          scale: 4, // Even higher scale for maximum quality
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          ignoreElements: (el) => el.tagName === 'SCRIPT' || el.tagName === 'STYLE',
          onclone: (clonedDoc) => {
            // Enhance colors in the cloned document for better contrast
            const elements = clonedDoc.querySelectorAll('*');
            elements.forEach(el => {
              const computedStyle = window.getComputedStyle(el);
              const htmlEl = el as HTMLElement;
              
              // Fix any lab() color functions
              if (computedStyle.background?.includes('lab(')) {
                htmlEl.style.background = '#0f172a';
              }
              if (computedStyle.backgroundColor?.includes('lab(')) {
                htmlEl.style.backgroundColor = '#0f172a';
              }
              if (computedStyle.color?.includes('lab(')) {
                htmlEl.style.color = '#f1f5f9';
              }
              
              // Enhance contrast for better quality
              if (htmlEl.style.background === '#1f2937') {
                htmlEl.style.background = '#0f172a'; // Much darker for better contrast
              }
              if (htmlEl.style.backgroundColor === '#1f2937') {
                htmlEl.style.backgroundColor = '#0f172a';
              }
              if (htmlEl.style.background === '#2563eb') {
                htmlEl.style.background = '#1e40af'; // Darker blue for better contrast
              }
              if (htmlEl.style.backgroundColor === '#2563eb') {
                htmlEl.style.backgroundColor = '#1e40af';
              }
              
              // Enhance text colors for better readability
              if (htmlEl.style.color === '#e2e8f0') {
                htmlEl.style.color = '#f1f5f9'; // Lighter text for better contrast
              }
              if (htmlEl.style.color === '#94a3b8') {
                htmlEl.style.color = '#cbd5e1'; // Lighter secondary text
              }
              if (htmlEl.style.color === '#f8fafc') {
                htmlEl.style.color = '#ffffff'; // Pure white for headers
              }
              if (htmlEl.style.color === '#93c5fd') {
                htmlEl.style.color = '#dbeafe'; // Lighter blue text
              }
              if (htmlEl.style.color === '#86efac') {
                htmlEl.style.color = '#bbf7d0'; // Lighter green text
              }
              if (htmlEl.style.color === '#fbbf24') {
                htmlEl.style.color = '#fde68a'; // Lighter yellow text
              }
            });
          }
        });

        const backBlob = await new Promise<Blob>((resolve) => {
          backCanvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
        });

        const backArrayBuffer = await backBlob.arrayBuffer();
        images[`${student.admissionNo}_back.png`] = new Uint8Array(backArrayBuffer);
      }
    } finally {
      document.body.removeChild(tempDiv);
    }
  }

  return images;
}

export async function generateBulkTeacherIdCards(
  teachers: any[],
  options: BulkIdCardOptions,
  schoolConfig: any
): Promise<BulkIdCardResult> {
  const { outputFormat, layout, includeBothSides } = options;
  
  // Generate ID card data for all teachers
  const idCards: TeacherIdCardData[] = teachers.map(teacher => ({
    name: teacher.name,
    employeeId: teacher.employeeId,
    department: teacher.department || 'General',
    designation: teacher.designation || 'Teacher',
    qualification: teacher.qualification,
    schoolName: schoolConfig.school?.name || 'School',
    schoolLogo: schoolConfig.schoolDetails?.logo_url,
    photo: teacher.photo,
    dateOfBirth: teacher.dateOfBirth,
    phone: teacher.phone,
    email: teacher.email,
    address: teacher.address,
    bloodGroup: teacher.bloodGroup,
    joiningDate: teacher.joiningDate,
    academicYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString().slice(-2),
    issueDate: new Date().toISOString().split('T')[0]
  }));

  const result: BulkIdCardResult = {
    summary: {
      totalStudents: teachers.length,
      format: outputFormat,
      layout,
      includeBothSides
    }
  };

  if (outputFormat === 'pdf' || outputFormat === 'both') {
    result.pdf = await generateBulkTeacherPDF(idCards, layout, includeBothSides);
  }

  return result;
}

async function generateBulkTeacherPDF(
  idCards: TeacherIdCardData[],
  layout: string,
  includeBothSides: boolean
): Promise<Uint8Array> {
  const pdf = new jsPDF({
    orientation: layout === 'individual' ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: false
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const cardWidth = 85; // mm
  const cardHeight = 55; // mm
  const padding = 10; // mm
  const cardsPerRow = Math.floor((pageWidth - padding * 2) / cardWidth);
  const cardsPerColumn = Math.floor((pageHeight - padding * 2) / cardHeight);

  let currentPage = 0;
  let cardIndex = 0;

  while (cardIndex < idCards.length) {
    if (currentPage > 0) {
      pdf.addPage();
    }
    currentPage++;

    for (let row = 0; row < cardsPerColumn && cardIndex < idCards.length; row++) {
      for (let col = 0; col < cardsPerRow && cardIndex < idCards.length; col++) {
        const x = padding + col * cardWidth;
        const y = padding + row * cardHeight;
        
        // Generate card HTML
        const cardHtml = await buildTeacherIdCardDocument(idCards[cardIndex], false);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtml;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '325px';
        document.body.appendChild(tempDiv);

        try {
          const canvas = await html2canvas(tempDiv, {
            scale: 4,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
          });

          const imgData = canvas.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);

          if (includeBothSides) {
            const backHtml = await buildTeacherIdCardDocument(idCards[cardIndex], true);
            tempDiv.innerHTML = backHtml;
            
            const backCanvas = await html2canvas(tempDiv, {
              scale: 4,
              backgroundColor: '#ffffff',
              useCORS: true,
              allowTaint: true,
            });

            const backImgData = backCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(backImgData, 'PNG', x + cardWidth + 2, y, cardWidth, cardHeight);
          }
        } finally {
          document.body.removeChild(tempDiv);
        }

        cardIndex++;
      }
    }
  }

  return new Uint8Array(pdf.output('arraybuffer'));
}

export function downloadBulkIdCards(result: BulkIdCardResult, students: any[]): void {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  
  if (result.pdf) {
    const pdfBlob = new Blob([result.pdf], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const pdfLink = document.createElement('a');
    pdfLink.href = pdfUrl;
    pdfLink.download = `Bulk_ID_Cards_${timestamp}.pdf`;
    document.body.appendChild(pdfLink);
    pdfLink.click();
    document.body.removeChild(pdfLink);
    URL.revokeObjectURL(pdfUrl);
  }

  if (result.images) {
    // Create a zip file with all images
    // For now, download them individually
    Object.entries(result.images).forEach(([filename, imageData]) => {
      const blob = new Blob([imageData], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }
}
