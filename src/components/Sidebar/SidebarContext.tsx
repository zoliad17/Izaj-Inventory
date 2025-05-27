import React, { createContext, useState, useContext, ReactNode } from "react";

// Define the shape of the context value
interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

// Create context with a default value
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Define props for the provider component
interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Custom hook with type checking
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
