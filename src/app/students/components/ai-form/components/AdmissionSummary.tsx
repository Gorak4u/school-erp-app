import React from 'react';
import { X } from 'lucide-react';

interface AdmissionSummaryProps {
  createdStudent: any;
  formData: any;
  previewPayload: any;
  combinedAnnual: number;
  fmtCurrency: (amount: number) => string;
  isDark: boolean;
  onCancel: () => void;
  showIdCard: boolean;
  setShowIdCard: (show: boolean) => void;
  showCardBack: boolean;
  setShowCardBack: (show: boolean) => void;
  idCardHtml: string;
  handlePrintIdCard: () => void;
  handleDownloadIdCardPdf: () => void;
  handlePrintPreview: () => void;
  handleDownloadPreviewPdf: () => void;
}

const AdmissionSummary: React.FC<AdmissionSummaryProps> = ({
  createdStudent,
  formData,
  previewPayload,
  combinedAnnual,
  fmtCurrency,
  isDark,
  onCancel,
  showIdCard,
  setShowIdCard,
  showCardBack,
  setShowCardBack,
  idCardHtml,
  handlePrintIdCard,
  handleDownloadIdCardPdf,
  handlePrintPreview,
  handleDownloadPreviewPdf,
}) => {
  // Helper text class matching the old form
  const helperTextCls = `text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`;

  return (
    <div className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-green-500">Admission Completed Successfully</h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {createdStudent?.name || formData.name} admitted successfully for {createdStudent?.class || formData.class || 'the selected class'} with admission number {createdStudent?.admissionNo || formData.admissionNo}.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-white'}`}
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6">
            {/* Admission Summary - Matching Old Version Exactly */}
            <div className={`rounded-xl border p-3 ${isDark ? 'border-gray-700 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className="text-base font-bold mb-3">Admission Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className={`rounded-lg border p-2 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <p className={helperTextCls}>Student Name</p>
                  <p className="font-semibold mt-0.5 text-sm">{createdStudent?.name || formData.name}</p>
                </div>
                <div className={`rounded-lg border p-2 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <p className={helperTextCls}>Admission No</p>
                  <p className="font-semibold mt-0.5 text-sm">{createdStudent?.admissionNo || formData.admissionNo}</p>
                </div>
                <div className={`rounded-lg border p-2 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <p className={helperTextCls}>Class</p>
                  <p className="font-semibold mt-0.5 text-sm">{createdStudent?.class || formData.class || '—'}</p>
                </div>
                <div className={`rounded-lg border p-2 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <p className={helperTextCls}>Section</p>
                  <p className="font-semibold mt-0.5 text-sm">{createdStudent?.section || formData.section || '—'}</p>
                </div>
                <div className={`rounded-lg border p-2 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <p className={helperTextCls}>Grand Total</p>
                  <p className="font-semibold mt-0.5 text-sm">{previewPayload ? fmtCurrency(previewPayload.summary.grandTotal) : fmtCurrency(combinedAnnual)}</p>
                </div>
                <div className={`rounded-lg border p-2 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <p className={helperTextCls}>Welcome Emails</p>
                  <p className="font-semibold mt-0.5 text-xs">Queued</p>
                </div>
              </div>
            </div>

            {/* ID Card Display - Matching Old Version Exactly */}
            <div className="space-y-2 md:space-y-4">
              <div className="flex justify-center items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setShowCardBack(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    !showCardBack
                      ? 'bg-blue-600 text-white'
                      : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  Front Side
                </button>
                <button
                  type="button"
                  onClick={() => setShowCardBack(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    showCardBack
                      ? 'bg-green-600 text-white'
                      : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  Back Side
                </button>
              </div>
              <div id="student-id-card-print" className="flex justify-center">
                <div dangerouslySetInnerHTML={{ __html: idCardHtml }} />
              </div>
              <div className="grid grid-cols-4 gap-1">
                <button type="button" onClick={handlePrintIdCard} className="px-2 py-1.5 rounded-lg text-xs font-semibold shadow bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 transition-transform">
                  Print ID
                </button>
                <button type="button" onClick={handleDownloadIdCardPdf} className={`px-2 py-1.5 rounded-lg text-xs font-medium border ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-white'}`}>
                  Save ID
                </button>
                <button type="button" onClick={handlePrintPreview} className={`px-2 py-1.5 rounded-lg text-xs font-medium border ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-white'}`}>
                  Print Preview
                </button>
                <button type="button" onClick={handleDownloadPreviewPdf} className={`px-2 py-1.5 rounded-lg text-xs font-medium border ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-white'}`}>
                  Save Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionSummary;
