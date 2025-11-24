/**
 * Responsive Layout Component - Chooses between desktop and mobile layouts
 * Implements requirements: 1.1, 1.2, 3.4
 */

"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "./MainLayout";
import MobileLayout from "./MobileLayout";

interface ResponsiveLayoutProps {
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ className = "" }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check initial screen size
    checkScreenSize();

    // Listen for window resize
    window.addEventListener("resize", checkScreenSize);
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Show mobile layout for small screens
  if (isMobile) {
    return <MobileLayout className={className} />;
  }

  // Show desktop layout for larger screens
  return <MainLayout className={className} />;
};

export default ResponsiveLayout;