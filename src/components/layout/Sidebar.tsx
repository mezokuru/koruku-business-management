import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  FileText, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import { useLogout } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/invoices', icon: FileText, label: 'Invoices' },
    { to: '/quotations', icon: FileText, label: 'Quotations' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#2c3e50] text-white z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ backgroundColor: '#2c3e50' }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo and close button */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ffd166] rounded-lg flex items-center justify-center">
              <span className="text-[#2c3e50] font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold">Koruku</span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-white/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#ffd166]"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 p-4" aria-label="Primary">
          <ul className="space-y-2" role="list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    end={item.to === '/'}
                  >
                    {({ isActive }) => (
                      <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#ffd166] ${
                          isActive
                            ? 'bg-[#ffd166] text-[#2c3e50] font-semibold'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon size={20} aria-hidden="true" />
                        <span>{item.label}</span>
                        {isActive && <span className="sr-only">(current page)</span>}
                      </div>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-h-[44px]"
            aria-label="Logout from application"
          >
            <LogOut size={20} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
