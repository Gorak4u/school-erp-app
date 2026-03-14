// @ts-nocheck
import { Student } from '../types';

export function createDocumentHandlers(ctx: any) {
  // Destructure all needed state from context
  const { communicationCenter, documentManagement, selectedStudents, setCommunicationCenter, setDocumentManagement, students } = ctx;

  // Document Management Functions
  const handleFileUpload = async (files: FileList, studentId: number, category: string, description: string) => {
    setDocumentManagement(prev => ({ 
      ...prev, 
      uploadStatus: 'uploading',
      uploadProgress: 0,
      uploadErrors: []
    }));

    try {
      const uploadedDocuments: typeof documentManagement.documents = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setDocumentManagement(prev => ({ ...prev, uploadProgress: ((i + 1) / files.length) * 100 }));

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          setDocumentManagement(prev => ({
            ...prev,
            uploadErrors: [...prev.uploadErrors, `${file.name}: ${validation.error}`]
          }));
          continue;
        }

        // Upload file to cloud storage (in production, implement actual cloud storage upload)
        // await uploadToCloudStorage(file);
        
        const document = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          studentId,
          name: file.name,
          type: file.type || getFileType(file.name),
          category,
          size: file.size,
          url: URL.createObjectURL(file), // In production, this would be a cloud storage URL
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Admin User',
          version: 1,
          isPublic: false,
          tags: extractTags(file.name, category),
          description,
          expiryDate: calculateExpiryDate(category)
        };

        uploadedDocuments.push(document);
      }

      // Update documents list
      setDocumentManagement(prev => ({
        ...prev,
        documents: [...prev.documents, ...uploadedDocuments],
        uploadStatus: uploadedDocuments.length > 0 ? 'success' : 'error',
        uploadProgress: 100
      }));

      // Update storage stats
      const totalSize = uploadedDocuments.reduce((acc, doc) => acc + doc.size, 0);
      setDocumentManagement(prev => ({
        ...prev,
        storageStats: {
          ...prev.storageStats,
          usedStorage: prev.storageStats.usedStorage + totalSize,
          totalFiles: prev.storageStats.totalFiles + uploadedDocuments.length
        }
      }));

    } catch (error) {
      setDocumentManagement(prev => ({
        ...prev,
        uploadStatus: 'error',
        uploadErrors: [error instanceof Error ? error.message : 'Upload failed']
      }));
    }
  };

  const validateFile = (file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedType = documentManagement.allowedFileTypes.find(type => 
      type.extensions.includes(fileExtension)
    );

    if (!allowedType) {
      return { calculateEstimatedCost, calculateExpiryDate, deleteDocument, downloadDocument, error: 'File type not allowed', extractTags, formatFileSize, getFileType, getFilteredDocuments, getFilteredTemplates, getRecipientCount, getRecipients, getStoragePercentage, handleFileUpload, handleSendMessage, personalizeMessage, selectTemplate, sendMessage, shareDocument, updateDocument, valid: false, validateFile, validateMessage };
    }

    if (file.size > allowedType.maxSize) {
      return { valid: false, error: `File size exceeds ${formatFileSize(allowedType.maxSize)} limit` };
    }

    return { valid: true };
  };

  const getFileType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const typeMap: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain'
    };
    return typeMap[extension || ''] || 'application/octet-stream';
  };

  const extractTags = (filename: string, category: string): string[] => {
    const tags = [category];
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
    
    // Extract potential tags from filename
    const tagPatterns = [
      /certificate/i,
      /report/i,
      /transcript/i,
      /medical/i,
      /identity/i,
      /achievement/i,
      /disciplinary/i
    ];

    tagPatterns.forEach(pattern => {
      if (pattern.test(nameWithoutExt)) {
        tags.push(pattern.source.replace(/\/i$/, ''));
      }
    });

    return tags;
  };

  const calculateExpiryDate = (category: string): string => {
    const now = new Date();
    const expiryMap: { [key: string]: number } = {
      'medical': 365 * 2, // 2 years
      'identity': 365 * 5, // 5 years
      'academic': 365, // 1 year
      'financial': 365 * 3, // 3 years
      'disciplinary': 365 * 10, // 10 years
      'achievement': -1, // Never expires
      'other': 365 // 1 year
    };

    const daysToAdd = expiryMap[category] || 365;
    if (daysToAdd === -1) return '';
    
    const expiryDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    return expiryDate.toISOString().split('T')[0];
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deleteDocument = (documentId: string) => {
    setDocumentManagement(prev => {
      const document = prev.documents.find(d => d.id === documentId);
      if (!document) return prev;

      return {
        ...prev,
        documents: prev.documents.filter(d => d.id !== documentId),
        storageStats: {
          ...prev.storageStats,
          usedStorage: prev.storageStats.usedStorage - document.size,
          totalFiles: prev.storageStats.totalFiles - 1
        }
      };
    });
  };

  const updateDocument = (documentId: string, updates: Partial<typeof documentManagement.documents[0]>) => {
    setDocumentManagement(prev => ({
      ...prev,
      documents: prev.documents.map(doc => 
        doc.id === documentId 
          ? { ...doc, ...updates, version: doc.version + 1 }
          : doc
      )
    }));
  };

  const downloadDocument = (document: typeof documentManagement.documents[0]) => {
    // In production, this would download from cloud storage
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.click();
  };

  const shareDocument = (documentId: string, isPublic: boolean) => {
    updateDocument(documentId, { isPublic });
    // In production, this would generate a shareable link
  };

  const getFilteredDocuments = () => {
    let filtered = documentManagement.documents;

    // Filter by student
    if (documentManagement.selectedStudent) {
      filtered = filtered.filter(doc => doc.studentId === documentManagement.selectedStudent!.id);
    }

    // Filter by category
    if (documentManagement.filterCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === documentManagement.filterCategory);
    }

    // Filter by search query
    if (documentManagement.searchQuery) {
      const query = documentManagement.searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[documentManagement.sortBy];
      const bValue = b[documentManagement.sortBy];
      
      if (documentManagement.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const getStoragePercentage = () => {
    return (documentManagement.storageStats.usedStorage / documentManagement.storageStats.totalStorage) * 100;
  };

  // Communication Center Functions
  const sendMessage = async (type: 'sms' | 'email', recipients: number[], content: string, subject?: string) => {
    setCommunicationCenter(prev => ({ 
      ...prev, 
      sendStatus: 'sending',
      sendProgress: 0,
      sendErrors: []
    }));

    try {
      // Send messages to recipients (in production, implement actual email/SMS sending)
      const totalRecipients = recipients.length;
      let sentCount = 0;
      let deliveredCount = 0;
      let failedCount = 0;

      for (let i = 0; i < recipients.length; i++) {
        const recipientId = recipients[i];
        const student = students.find(s => s.id === recipientId);
        
        if (student) {
          // Personalize message content
          const personalizedContent = personalizeMessage(content, student);
          const personalizedSubject = subject ? personalizeMessage(subject, student) : undefined;
          
          // TODO: Implement actual email/SMS sending
          // const result = await sendEmailOrSMS(student, personalizedSubject, personalizedContent);
          
          // For now, simulate successful delivery
          sentCount++;
          deliveredCount++;
        }
        
        setCommunicationCenter(prev => ({ 
          ...prev, 
          sendProgress: ((i + 1) / recipients.length) * 100 
        }));
      }

      // Create message record
      const deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed' = 
        sentCount === totalRecipients ? 'delivered' : failedCount > 0 ? 'failed' : 'sent';
      
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        recipients,
        subject,
        content,
        sentAt: new Date().toISOString(),
        sentBy: 'Admin User',
        deliveryStatus,
        deliveryStats: {
          total: totalRecipients,
          sent: sentCount,
          delivered: deliveredCount,
          failed: failedCount
        }
      };

      // Update message history
      setCommunicationCenter(prev => ({
        ...prev,
        messageHistory: [message, ...prev.messageHistory],
        sendStatus: 'success',
        sendProgress: 100
      }));

    } catch (error) {
      setCommunicationCenter(prev => ({
        ...prev,
        sendStatus: 'error',
        sendErrors: [error instanceof Error ? error.message : 'Message sending failed']
      }));
    }
  };

  const personalizeMessage = (content: string, student: Student): string => {
    const replacements: { [key: string]: string } = {
      '{student_name}': student.name,
      '{student_class}': student.class,
      '{student_roll}': student.rollNo,
      '{parent_name}': student.fatherName || student.motherName || 'Parent',
      '{parent_phone}': student.fatherPhone || student.parentPhone,
      '{parent_email}': student.fatherEmail || student.parentEmail,
      '{school_name}': 'Excel Academy',
      '{school_phone}': '+91-9876543210',
      '{school_email}': 'info@excelacademy.edu',
      '{attendance_percentage}': student.attendance.percentage.toString(),
      '{gpa}': student.academics.gpa.toString(),
      '{rank}': student.academics.rank.toString(),
      '{fee_amount}': `₹${student.fees.pending.toLocaleString()}`,
      '{due_date}': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      '{date}': new Date().toLocaleDateString(),
      '{time}': new Date().toLocaleTimeString()
    };

    let personalized = content;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      personalized = personalized.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return personalized;
  };

  const selectTemplate = (templateId: string) => {
    const allTemplates = [...communicationCenter.smsTemplates, ...communicationCenter.emailTemplates];
    const template = allTemplates.find(t => t.id === templateId);
    
    if (template) {
      const subject = 'subject' in template ? (template as any).subject : '';
      setCommunicationCenter(prev => ({
        ...prev,
        selectedTemplate: templateId,
        messageContent: template.content,
        subject
      }));
    }
  };

  const getFilteredTemplates = () => {
    const templates = communicationCenter.messageType === 'sms' 
      ? communicationCenter.smsTemplates 
      : communicationCenter.emailTemplates;
    
    return templates;
  };

  const getRecipientCount = () => {
    return communicationCenter.selectedRecipients.length > 0 
      ? communicationCenter.selectedRecipients.length 
      : selectedStudents.length;
  };

  const getRecipients = () => {
    return communicationCenter.selectedRecipients.length > 0 
      ? communicationCenter.selectedRecipients 
      : selectedStudents;
  };

  const calculateEstimatedCost = () => {
    const recipients = getRecipients();
    const provider = communicationCenter.deliveryProviders[communicationCenter.messageType][0]; // Use first active provider
    return recipients.length * parseFloat(provider.rate);
  };

  const validateMessage = () => {
    const errors: string[] = [];
    const recipients = getRecipients();
    
    if (recipients.length === 0) {
      errors.push('Please select at least one recipient');
    }
    
    if (communicationCenter.messageType === 'email' && !communicationCenter.subject.trim()) {
      errors.push('Subject is required for email messages');
    }
    
    if (!communicationCenter.messageContent.trim()) {
      errors.push('Message content is required');
    }
    
    if (communicationCenter.messageType === 'sms' && communicationCenter.messageContent.length > 160) {
      errors.push('SMS message should not exceed 160 characters');
    }
    
    return errors;
  };

  const handleSendMessage = () => {
    const errors = validateMessage();
    if (errors.length > 0) {
      setCommunicationCenter(prev => ({
        ...prev,
        sendErrors: errors,
        sendStatus: 'error'
      }));
      return;
    }
    
    const recipients = getRecipients();
    sendMessage(
      communicationCenter.messageType,
      recipients,
      communicationCenter.messageContent,
      communicationCenter.messageType === 'email' ? communicationCenter.subject : undefined
    );
  };


  return { handleFileUpload, validateFile, getFileType, extractTags, calculateExpiryDate, formatFileSize, deleteDocument, updateDocument, downloadDocument, shareDocument, getFilteredDocuments, getStoragePercentage, sendMessage, personalizeMessage, selectTemplate, getFilteredTemplates, getRecipientCount, getRecipients, calculateEstimatedCost, validateMessage, handleSendMessage };
}
