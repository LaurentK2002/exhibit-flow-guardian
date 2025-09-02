import { Shield, Database, FileText, Settings, Search, Users, BarChart3, LogOut, User } from "lucide-react";
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

export const Navigation = () => {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-border/20 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-lg shadow-md">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Tanzania Police Force</h1>
                <p className="text-sm text-blue-200">Cyber Crimes Investigation Unit</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-1">
              <Button variant="ghost" className="text-blue-100 hover:text-white hover:bg-white/10 transition-colors">
                <Database className="h-4 w-4 mr-2" />
                Digital Exhibits
              </Button>
              <Button variant="ghost" className="text-blue-100 hover:text-white hover:bg-white/10 transition-colors">
                <FileText className="h-4 w-4 mr-2" />
                Case Files
              </Button>
              <Button variant="ghost" className="text-blue-100 hover:text-white hover:bg-white/10 transition-colors">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="ghost" className="text-blue-100 hover:text-white hover:bg-white/10 transition-colors">
                <Users className="h-4 w-4 mr-2" />
                Personnel
              </Button>
              <Button variant="ghost" className="text-blue-100 hover:text-white hover:bg-white/10 transition-colors">
                <Settings className="h-4 w-4 mr-2" />
                System Config
              </Button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" />
              <Input 
                placeholder="Search cases, exhibits, personnel..." 
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
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
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