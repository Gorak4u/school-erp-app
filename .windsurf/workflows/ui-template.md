---
description: School ERP UI template standards - apply consistent modern styling to all pages
---

## School ERP UI Template Standard

All pages in the School ERP app must follow the modern design system established in the Students and Fees pages. Apply the following patterns consistently.

### 1. CSS Variable Definitions (add at the top of every page component)

```tsx
const isDark = theme === 'dark';

const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;
const text = isDark ? 'text-white' : 'text-gray-900';
const subtext = isDark ? 'text-gray-400' : 'text-gray-500';
const row = `p-4 rounded-xl border ${isDark ? 'border-gray-600/50 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'}`;
```

### 2. Page Header Pattern

```tsx
<div className={`rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-8 shadow-lg`}>
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
          {/* SVG icon */}
        </div>
        <div>
          <h1 className={`text-3xl font-bold ${text}`}>Page Title</h1>
          <p className={`text-sm ${subtext} mt-1`}>Subtitle or description</p>
        </div>
      </div>
    </div>
    <div className="flex flex-wrap gap-3">
      {/* Action buttons using btnPrimary */}
    </div>
  </div>
</div>
```

### 3. Tab Navigation Pattern

```tsx
<div className={`rounded-2xl border p-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
  <div className="flex gap-1">
    {TABS.map(t => (
      <button
        key={t.id}
        onClick={() => setActiveTab(t.id)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
          activeTab === t.id
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
            : isDark
              ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <span className="text-lg">{t.icon}</span>
        <span className="hidden sm:inline">{t.label}</span>
      </button>
    ))}
  </div>
</div>
```

### 4. Stats Cards Pattern

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Label</p>
        <p className={`text-3xl font-bold mt-2 ${text}`}>Value</p>
        <p className={`text-xs ${subtext} mt-1`}>Sub-label</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
        {/* icon */}
      </div>
    </div>
  </div>
  {/* Repeat with green/purple/orange color variants */}
</div>
```

### 5. Filter/Content Card Pattern

```tsx
<div className={`rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-6 shadow-lg`}>
  <div className="flex items-center gap-3 mb-6">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
      {/* icon */}
    </div>
    <div>
      <h3 className={`text-lg font-semibold ${text}`}>Section Title</h3>
      <p className={`text-sm ${subtext}`}>Description</p>
    </div>
  </div>
  {/* content */}
</div>
```

### 6. Table Wrapper Pattern

```tsx
<div className={`rounded-2xl border overflow-hidden shadow-lg ${card}`}>
  <table className="w-full text-sm">
    <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
      <tr>
        <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${subtext}`}>Column</th>
      </tr>
    </thead>
    <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
      <tr className={`transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
        <td className={`px-4 py-3 text-sm ${text}`}>Value</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 7. Modal Pattern

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
  <div className={`relative w-full max-w-xl rounded-2xl border overflow-hidden shadow-2xl ${card} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
    {/* Modal Header */}
    <div className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
          {/* icon */}
        </div>
        <div>
          <h3 className={`text-lg font-bold ${text}`}>Modal Title</h3>
          <p className={`text-xs ${subtext}`}>Subtitle</p>
        </div>
      </div>
      <button onClick={closeModal} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    {/* Modal Body */}
    <div className="p-6 overflow-y-auto flex-1">
      {/* form fields using input and label vars */}
    </div>
    {/* Modal Footer */}
    <div className={`px-6 py-4 border-t flex gap-3 flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <button disabled={saving} className={`flex-1 ${btnPrimary} justify-center flex items-center gap-2`}>
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button onClick={closeModal} className={btnSecondary}>Cancel</button>
    </div>
  </div>
</div>
```

### 8. Status Badge Pattern

```tsx
<span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
  status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
}`}>
  {status}
</span>
```

### Key Rules

- **Always use `rounded-2xl`** for cards, modals, table wrappers (not `rounded-lg` or `rounded-xl`)
- **Always use `rounded-xl`** for inputs, buttons, icon containers
- **Always use gradient backgrounds** on cards: `bg-gradient-to-br from-gray-800 to-gray-900` (dark) / `bg-gradient-to-br from-white to-gray-50` (light)
- **Always use gradient buttons**: `bg-gradient-to-r from-blue-600 to-blue-700` with `hover:scale-105`
- **Always include `shadow-lg`** on cards and `shadow-2xl` on modals
- **Always include `backdrop-blur-sm`** on modal overlays
- **Modal overlay**: use `bg-black/60 backdrop-blur-sm` not `bg-black/50`
- **Inputs**: use `px-4 py-2.5` not `px-3 py-2`
- **Labels**: use `font-semibold` and `mb-2`

### Applying to a New Page

1. Add `const isDark = theme === 'dark';` after `const { theme } = useTheme();`
2. Copy all CSS variable definitions from section 1 above
3. Replace all `rounded-lg` usages with `rounded-xl` (inputs/buttons) or `rounded-2xl` (cards/modals)
4. Replace `bg-gray-800 border-gray-700` card backgrounds with the gradient `card` variable
5. Replace `px-3 py-2` inputs with `px-4 py-2.5`
6. Replace plain `bg-blue-600` buttons with gradient `btnPrimary` variable
7. Update modals to use the header/body/footer pattern from section 7
8. Run build to verify: `npm run build`
