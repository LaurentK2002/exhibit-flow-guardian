import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Package, Microscope, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RoleSwitcherProps {
  currentViewRole: string;
  onRoleChange: (role: string) => void;
}

export const RoleSwitcher = ({ currentViewRole, onRoleChange }: RoleSwitcherProps) => {
  const { profile } = useAuth();

  // Show for all users during testing - you can change this later
  const showSwitcher = true; // Changed from: profile?.role === 'admin'

  if (!showSwitcher) {
    return null;
  }

  const roleOptions = [
    { value: 'admin', label: 'Administrator', icon: Shield, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    { value: 'commanding_officer', label: 'Commanding Officer', icon: Users, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { value: 'exhibit_officer', label: 'Exhibit Officer', icon: Package, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { value: 'analyst', label: 'Analyst', icon: Microscope, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' }
  ];

  const currentRole = roleOptions.find(r => r.value === currentViewRole);

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <Settings className="h-5 w-5" />
          Dashboard Review Mode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Viewing as:</span>
            {currentRole && (
              <Badge className={currentRole.color}>
                <currentRole.icon className="h-4 w-4 mr-1" />
                {currentRole.label}
              </Badge>
            )}
          </div>
          
          <Select value={currentViewRole} onValueChange={onRoleChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Switch role view" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  <div className="flex items-center gap-2">
                    <role.icon className="h-4 w-4" />
                    {role.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onRoleChange(profile?.role || 'admin')}
            className="text-xs"
          >
            Reset to My Role
          </Button>
        </div>
        
        <div className="text-xs text-orange-600 dark:text-orange-400 mt-2 space-y-1">
          <p>Dashboard Testing Mode: Switch between different role views to test all panels.</p>
          <p>Your actual role: <strong>{profile?.role || 'Loading...'}</strong></p>
        </div>
      </CardContent>
    </Card>
  );
};