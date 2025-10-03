import { Shield, Database, FileText, Settings, Search, Users, BarChart3, LogOut, User, Activity, AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          { icon: Users, label: 'Team Management', path: '/team' },
          { icon: AlertTriangle, label: 'Security Alerts', path: '/security' },
          { icon: FileText, label: 'Case Reports', path: '/reports' },
        ];
      case 'exhibit_officer':
        return [
          { icon: Database, label: 'Evidence Queue', path: '/evidence-queue' },
          { icon: Activity, label: 'Chain of Custody', path: '/chain-of-custody' },
          { icon: FileText, label: 'Case Files', path: '/cases' },
          { icon: Search, label: 'Evidence Search', path: '/search' },
        ];
      case 'analyst':
        return [
          { icon: FileText, label: 'My Cases', path: '/cases' },
          { icon: FileText, label: 'Investigation Reports', path: '/reports' },
          { icon: BarChart3, label: 'Case Analytics', path: '/analytics' },
        ];
      default:
        return [
          { icon: FileText, label: 'Dashboard', path: '/' },
          { icon: Search, label: 'Search', path: '/search' },
        ];
    }
  };

  // Role-specific search placeholders
  const getSearchPlaceholder = () => {
    switch (profile?.role) {
      case 'admin':
        return 'Search users, cases, exhibits, system data...';
      case 'commanding_officer':
        return 'Search operations, team reports, security alerts...';
      case 'exhibit_officer':
        return 'Search evidence, exhibits, chain of custody...';
      case 'analyst':
        return 'Search investigations, cases, reports...';
      default:
        return 'Search system resources...';
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-border/20 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg shadow-md">
                <img 
                  src="/images/tanzania-police-logo.png" 
                  alt="Tanzania Police Force Logo" 
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div className="flex items-center space-x-6">
                <h1 className="text-2xl font-bold text-white tracking-wider">TANZANIA POLICE FORCE</h1>
                <div className="h-8 w-px bg-blue-300 opacity-50"></div>
                <p className="text-sm text-blue-200 font-medium">Cyber Crimes Investigation Unit</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-1">
              <Button variant="ghost" className="text-blue-100 hover:text-white hover:bg-white/10 transition-colors" asChild>
                <Link to="/" aria-label="Home" title="Home">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
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
            <div className="relative hidden sm:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" />
              <Input 
                placeholder={getSearchPlaceholder()} 
                className="pl-9 w-72 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 focus:border-blue-300"
              />
            </div>
            
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
              <DropdownMenuContent align="end" className="w-56">
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