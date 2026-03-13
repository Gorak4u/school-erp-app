// Design System Exports for Next.js
// Based on the School Management ERP UI Design Documents

// Export design tokens
export * from './tokens/colors-simple';
export { default as theme } from './tokens/theme';

// Export components
export { default as Button } from './components/Button-simple';
export { default as ButtonAdvanced } from './components/Button-advanced';
export { default as Input } from './components/Input';
export { default as Card, CardHeader, CardContent, CardFooter } from './components/Card';
export { default as Badge } from './components/Badge';
export { default as Hero } from './components/Hero';
export { default as Features } from './components/Features';
export { default as Testimonials } from './components/Testimonials';
export { default as Pricing } from './components/Pricing';
export { default as Login } from './components/Login-simple';
export { default as Register } from './components/Register-simple';
export { default as ProtectedRoute } from './components/ProtectedRoute-simple';

// Export contexts  
export * from './contexts/AuthContext-simple';
