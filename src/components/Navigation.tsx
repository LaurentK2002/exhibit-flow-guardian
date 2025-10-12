import { Shield, Database, FileText, Settings, Users, BarChart3, LogOut, User, Activity, AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "./NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

export const Navigation = () => {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // Role-specific navigation items
  const getNavigationItems = () => {
    switch (profile?.role) {
      case 'admin':
        return [
          { icon: Database, label: 'Digital Exhibits', path: '/exhibits' },
          { icon: FileText, label: 'Case Management', path: '/cases' },
          { icon: BarChart3, label: 'System Analytics', path: '/analytics' },
          { icon: Users, label: 'User Management', path: '/users' },
          { icon: Settings, label: 'System Config', path: '/settings' },
        ];
      case 'commanding_officer':
        return [
          { icon: BarChart3, label: 'Operations Overview', path: '/operations' },
          { icon: FileText, label: 'Case Search', path: '/cases' },
          { icon: Users, label: 'Team Management', path: '/team' },
          { icon: AlertTriangle, label: 'Security Alerts', path: '/security' },
          { icon: FileText, label: 'Case Reports', path: '/reports' },
        ];
      case 'officer_commanding_unit':
        return [
          { icon: FileText, label: 'Case Search', path: '/cases' },
          { icon: Users, label: 'Team Management', path: '/team' },
          { icon: BarChart3, label: 'Operations', path: '/operations' },
          { icon: FileText, label: 'Reports', path: '/reports' },
        ];
      case 'exhibit_officer':
        return [];
      case 'analyst':
        return [
          { icon: FileText, label: 'My Cases', path: '/cases' },
          { icon: FileText, label: 'Investigation Reports', path: '/reports' },
          { icon: BarChart3, label: 'Case Analytics', path: '/analytics' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-border/20 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold text-white tracking-wider">TANZANIA POLICE FORCE</h1>
              <div className="h-8 w-px bg-blue-300 opacity-50"></div>
              <p className="text-sm text-blue-200 font-medium">Cyber Crimes Investigation Unit</p>
            </div>
            
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item, index) => (
                <Button key={index} variant="ghost" className="text-blue-100 hover:text-white hover:bg-white/10 transition-colors" asChild>
                  <Link to={item.path} aria-label={item.label} title={item.label}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-blue-100 hover:text-white hover:bg-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden md:block">{profile?.full_name || 'Officer'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark w-56 border border-border/30">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.badge_number && `Badge: ${profile.badge_number}`}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'Officer'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <User className="mr-2 h-4 w-4" />
                    Profile & Security
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};