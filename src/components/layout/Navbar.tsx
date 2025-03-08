import React from 'react';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
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
  return <header className={cn("h-16 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10", className)}>
      <div className="h-full container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onMenuClick} className="p-2 rounded-md hover:bg-muted md:hidden transition-colors">
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="flex-1 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <img src="/lovable-uploads/03b1441a-ce62-4bad-b62c-5e489f2a4977.png" alt="MAURICE ENGINEERING WORKS" className="h-14 object-fill" />
          </div>
        </div>
        
        <div className="w-20">
          {/* Empty div for layout balance */}
        </div>
      </div>
    </header>;
};
export default Navbar;