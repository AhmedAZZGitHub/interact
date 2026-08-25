import { useState, useEffect } from 'react';

export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveLayout {
  mode: LayoutMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 992;
  const isDesktop = width >= 992;

  let mode: LayoutMode = 'desktop';
  if (isMobile) mode = 'mobile';
  else if (isTablet) mode = 'tablet';

  return {
    mode,
    isMobile,
    isTablet,
    isDesktop,
    width
  };
}
