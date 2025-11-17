import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  actionButton?: ReactNode;
  searchBar?: ReactNode;
}

const Header = ({ title, onMenuClick, actionButton, searchBar }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4" role="banner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Hamburger menu button (mobile only) */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open navigation menu"
            aria-expanded="false"
          >
            <Menu size={24} className="text-primary" aria-hidden="true" />
          </button>

          {/* Page title */}
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
        </div>

        {/* Search bar (if provided) */}
        {searchBar && (
          <div className="hidden sm:block flex-1 max-w-md mx-4" role="search">
            {searchBar}
          </div>
        )}

        {/* Action button (if provided) */}
        {actionButton && (
          <div className="flex items-center gap-2">
            {actionButton}
          </div>
        )}
      </div>

      {/* Mobile search bar */}
      {searchBar && (
        <div className="sm:hidden mt-4" role="search">
          {searchBar}
        </div>
      )}
    </header>
  );
};

export default Header;
