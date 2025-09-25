import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

export const AddUserDialog = ({ open, onOpenChange, onUserAdded }: AddUserDialogProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    badgeNumber: '',
    role: '' as UserRole | '',
    department: 'Cyber Crimes Unit',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to create users');
      }

      // Call the Edge Function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          badgeNumber: formData.badgeNumber,
          role: formData.role,
          department: formData.department,
          phone: formData.phone
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to create user');
      }

      toast({
        title: "Success",
        description: "User account created successfully",
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        fullName: '',
        badgeNumber: '',
        role: '' as UserRole | '',
        department: 'Cyber Crimes Unit',
        phone: ''
      });

      onUserAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error('User creation error:', error);
      
      let errorMessage = error.message;
      if (error.message?.includes('User already registered')) {
        errorMessage = 'A user with this email already exists';
      } else if (error.message?.includes('not authorized') || error.message?.includes('Only administrators')) {
        errorMessage = 'You do not have permission to create users. Only administrators can create new users.';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User Account</DialogTitle>
          <DialogDescription>
            Add a new user to the forensic evidence management system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badgeNumber">Badge Number</Label>
              <Input
                id="badgeNumber"
                value={formData.badgeNumber}
                onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="User will be required to change this"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">Administrator</SelectItem>
                  <SelectItem value="commanding_officer">Commanding Officer</SelectItem>
                  <SelectItem value="officer_commanding_unit">Officer Commanding Unit</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="exhibit_officer">Exhibit Officer</SelectItem>
                  <SelectItem value="forensic_analyst">Forensic Analyst</SelectItem>
                  <SelectItem value="investigator">Investigator</SelectItem>
                  <SelectItem value="case_officer">Case Officer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.email || !formData.password || !formData.fullName || !formData.role}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};