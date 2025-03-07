
import React from 'react';
import { cn } from '@/lib/utils';
import { Bell, Search, Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
  pageTitle?: string;
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onMenuClick,
  pageTitle,
  className 
}) => {
  return (
    <header 
      className={cn(
        "h-16 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10",
        className
      )}
    >
      <div className="h-full container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-muted md:hidden transition-colors"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          
          {pageTitle && (
            <h1 className="font-semibold text-lg hidden md:block">{pageTitle}</h1>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="py-2 pl-10 pr-4 border rounded-md bg-muted/20 w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          
          <div className="relative">
            <button className="p-2 rounded-md hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
