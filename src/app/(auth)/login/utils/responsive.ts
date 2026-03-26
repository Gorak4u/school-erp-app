// Responsive design utilities for login page

export const useResponsiveLayout = () => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      deviceType: 'desktop' as const,
    };
  }

  const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile' as const;
    if (width < 1024) return 'tablet' as const;
    return 'desktop' as const;
  };

  const deviceType = getDeviceType();
  
  return {
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    deviceType,
  };
};

export const getResponsiveClasses = (deviceType: 'mobile' | 'tablet' | 'desktop') => {
  const baseClasses = {
    container: 'min-h-screen flex items-center justify-center p-4',
    grid: 'w-full max-w-6xl mx-auto grid gap-12 items-center',
    leftColumn: 'space-y-8',
    rightColumn: 'w-full max-w-md mx-auto',
  };

  const responsiveClasses = {
    mobile: {
      container: baseClasses.container,
      grid: baseClasses.grid.replace('grid-cols-1 lg:grid-cols-2', 'grid-cols-1'),
      leftColumn: `${baseClasses.leftColumn} text-center`,
      rightColumn: `${baseClasses.rightColumn} mt-8`,
    },
    tablet: {
      container: baseClasses.container,
      grid: baseClasses.grid.replace('grid-cols-1 lg:grid-cols-2', 'grid-cols-1 lg:grid-cols-2'),
      leftColumn: baseClasses.leftColumn,
      rightColumn: baseClasses.rightColumn,
    },
    desktop: {
      container: baseClasses.container,
      grid: baseClasses.grid,
      leftColumn: baseClasses.leftColumn,
      rightColumn: baseClasses.rightColumn,
    },
  };

  return responsiveClasses[deviceType];
};

export const getResponsiveAnimationProps = (deviceType: 'mobile' | 'tablet' | 'desktop') => {
  const baseProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8 },
  };

  const responsiveProps = {
    mobile: {
      ...baseProps,
      transition: { ...baseProps.transition, duration: 0.6 },
    },
    tablet: {
      ...baseProps,
      transition: { ...baseProps.transition, duration: 0.7 },
    },
    desktop: baseProps,
  };

  return responsiveProps[deviceType];
};

export const optimizeForMobile = (deviceType: 'mobile' | 'tablet' | 'desktop') => {
  const optimizations = {
    mobile: {
      // Reduce animation complexity for mobile
      reduceAnimations: true,
      // Simplify background effects
      simpleBackground: true,
      // Adjust font sizes
      smallerText: true,
      // Increase touch targets
      largerTouchTargets: true,
    },
    tablet: {
      reduceAnimations: false,
      simpleBackground: false,
      smallerText: false,
      largerTouchTargets: false,
    },
    desktop: {
      reduceAnimations: false,
      simpleBackground: false,
      smallerText: false,
      largerTouchTargets: false,
    },
  };

  return optimizations[deviceType];
};
