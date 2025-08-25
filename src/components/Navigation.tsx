import { Shield, Database, FileText, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Navigation = () => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Cyber Crimes Unit</h1>
                <p className="text-sm text-muted-foreground">Digital Forensics Management System</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-1">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                <Database className="h-4 w-4 mr-2" />
                Exhibits
              </Button>
              <Button variant="ghost" className="text-foreground hover:text-primary">
                <FileText className="h-4 w-4 mr-2" />
                Cases
              </Button>
              <Button variant="ghost" className="text-foreground hover:text-primary">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search exhibits, cases..." 
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};