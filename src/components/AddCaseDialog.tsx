import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type CasePriority = Database['public']['Enums']['case_priority'];
type CaseStatus = Database['public']['Enums']['case_status'];

interface AddCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddCaseDialog = ({ open, onOpenChange, onSuccess }: AddCaseDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as CasePriority,
    status: 'open' as CaseStatus,
    location: '',
    victimName: '',
    suspectName: '',
    incidentDate: '',
  });

  const generateCaseNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `CR-${year}-${random}`;
  };

  const generateLabNumber = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_case_lab_number');
      if (error) {
        console.error('Error generating lab number:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error generating lab number:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const caseNumber = generateCaseNumber();
      const labNumber = await generateLabNumber();
      
      const { error } = await supabase
        .from('cases')
        .insert({
          case_number: caseNumber,
          lab_number: labNumber,
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          status: formData.status,
          location: formData.location || null,
          victim_name: formData.victimName || null,
          suspect_name: formData.suspectName || null,
          incident_date: formData.incidentDate ? new Date(formData.incidentDate).toISOString() : null,
        });

      if (error) throw error;

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: (await supabase
            .from('cases')
            .select('id')
            .eq('case_number', caseNumber)
            .single()).data?.id,
          activity_type: 'case_created',
          description: `New case "${formData.title}" created with case number ${caseNumber} and lab number ${labNumber}`,
          metadata: { priority: formData.priority, status: formData.status, lab_number: labNumber },
        });

      toast({
        title: "Case Created",
        description: `Case ${caseNumber} with lab number ${labNumber} has been successfully created.`,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'open',
        location: '',
        victimName: '',
        suspectName: '',
        incidentDate: '',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter case title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: CasePriority) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed case description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Incident location"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="incidentDate">Incident Date</Label>
              <Input
                id="incidentDate"
                type="datetime-local"
                value={formData.incidentDate}
                onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="victimName">Victim Name</Label>
              <Input
                id="victimName"
                value={formData.victimName}
                onChange={(e) => setFormData({ ...formData, victimName: e.target.value })}
                placeholder="Victim's name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suspectName">Suspect Name</Label>
              <Input
                id="suspectName"
                value={formData.suspectName}
                onChange={(e) => setFormData({ ...formData, suspectName: e.target.value })}
                placeholder="Suspect's name (if known)"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};