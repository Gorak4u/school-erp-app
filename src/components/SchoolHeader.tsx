'use client';

import React from 'react';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

interface SchoolHeaderProps {
  variant?: 'receipt' | 'report' | 'document' | 'print';
  showAddress?: boolean;
  showContact?: boolean;
  className?: string;
}

/**
 * Reusable school header component for receipts, reports, and print documents.
 * Pulls school name, logo, address, and contact info from the centralized settings.
 */
export default function SchoolHeader({
  variant = 'receipt',
  showAddress = true,
  showContact = true,
  className = '',
}: SchoolHeaderProps) {
  const { getSetting } = useSchoolConfig();

  const name = getSetting('school_details', 'name', 'School Name');
  const logoUrl = getSetting('school_details', 'logo_url', '');
  const address = getSetting('school_details', 'address', '');
  const city = getSetting('school_details', 'city', '');
  const state = getSetting('school_details', 'state', '');
  const pincode = getSetting('school_details', 'pincode', '');
  const phone = getSetting('school_details', 'phone', '');
  const email = getSetting('school_details', 'email', '');
  const website = getSetting('school_details', 'website', '');
  const affiliationNo = getSetting('school_details', 'affiliation_no', '');

  const fullAddress = [address, city, state, pincode].filter(Boolean).join(', ');

  if (variant === 'print') {
    return (
      <div className={`text-center border-b-2 border-black pb-4 mb-4 ${className}`}>
        <div className="flex items-center justify-center gap-4">
          {logoUrl && <img src={logoUrl} alt="School Logo" className="w-16 h-16 object-contain" />}
          <div>
            <h1 className="text-2xl font-bold uppercase">{name}</h1>
            {affiliationNo && <p className="text-xs text-gray-600">Affiliation No: {affiliationNo}</p>}
          </div>
        </div>
        {showAddress && fullAddress && <p className="text-sm mt-1">{fullAddress}</p>}
        {showContact && (phone || email) && (
          <p className="text-xs text-gray-600 mt-1">
            {phone && `Phone: ${phone}`}{phone && email && ' | '}{email && `Email: ${email}`}
          </p>
        )}
      </div>
    );
  }

  // Default: receipt/report/document variant (dark/light theme aware)
  return (
    <div className={`flex items-center gap-4 pb-4 mb-4 border-b border-gray-300 ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt="School Logo" className="w-14 h-14 object-contain rounded" />
      ) : (
        <div className="w-14 h-14 bg-blue-100 rounded flex items-center justify-center text-2xl">🏫</div>
      )}
      <div className="flex-1">
        <h2 className="text-xl font-bold">{name}</h2>
        {showAddress && fullAddress && <p className="text-sm text-gray-500">{fullAddress}</p>}
        {showContact && (phone || email || website) && (
          <p className="text-xs text-gray-400">
            {[phone && `📞 ${phone}`, email && `✉️ ${email}`, website && `🌐 ${website}`].filter(Boolean).join('  •  ')}
          </p>
        )}
      </div>
    </div>
  );
}
