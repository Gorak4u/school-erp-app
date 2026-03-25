// Utils for Settings Page

export const showToast = (t: any) => { if ((window as any).toast) (window as any).toast(t); };

// CSS class generators (theme-aware)
export const getCardClass = (isDark: boolean) =>
  `rounded-2xl border p-6 shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;

export const getRowClass = (isDark: boolean) =>
  `p-4 rounded-xl border ${isDark ? 'border-gray-600/50 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'}`;

export const getInputClass = (isDark: boolean) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;

export const getLabelClass = (isDark: boolean) =>
  `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

export const getBtnPrimaryClass = (isDark: boolean) =>
  `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;

export const getBtnDangerClass = (isDark: boolean) =>
  `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

export const getBtnSecondaryClass = (isDark: boolean) =>
  `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'}`;

export const getBadgeClass = (isDark: boolean, active: boolean) =>
  `px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;

export const getHeadingClass = (isDark: boolean) =>
  `text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`;

export const getSubtextClass = (isDark: boolean) =>
  `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`;
