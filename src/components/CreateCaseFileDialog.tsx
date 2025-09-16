import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { Upload, X } from 'lucide-react';

type CaseStatus = Database['public']['Enums']['case_status'];
type CasePriority = Database['public']['Enums']['case_priority'];

interface CreateCaseFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateCaseFileDialog = ({ open, onOpenChange, onSuccess }: CreateCaseFileDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    description: '',
    victimName: '',
    suspectName: '',
    location: '',
    incidentDate: '',
    status: 'open' as CaseStatus,
    priority: 'medium' as CasePriority,
  });

  const generateCaseNumber = async () => {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from('cases')
      .select('case_number')
      .like('case_number', `CCU-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].case_number.split('-')[2]) || 0;
      nextNumber = lastNumber + 1;
    }

    return `CCU-${year}-${nextNumber.toString().padStart(4, '0')}`;
  };

  useEffect(() => {
    if (open) {
      generateCaseNumber().then(caseNumber => {
        setFormData(prev => ({ ...prev, caseNumber }));
      });
    }
  }, [open]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDocuments = async (caseId: string) => {
    if (selectedFiles.length === 0) return [];

    const uploadPromises = selectedFiles.map(async (file) => {
      const fileName = `${caseId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('case-documents')
        .upload(fileName, file);

      if (error) throw error;
      return fileName;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the case
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          case_number: formData.caseNumber,
          title: formData.title,
          description: formData.description,
          victim_name: formData.victimName || null,
          suspect_name: formData.suspectName || null,
          location: formData.location || null,
          incident_date: formData.incidentDate ? new Date(formData.incidentDate).toISOString() : null,
          status: formData.status,
          priority: formData.priority,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Upload documents if any
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        try {
          await uploadDocuments(caseData.id);
        } catch (uploadError) {
          console.error('Error uploading documents:', uploadError);
          toast({
            title: "Warning",
            description: "Case created successfully, but some documents failed to upload.",
            variant: "destructive",
          });
        } finally {
          setUploadingFiles(false);
        }
      }

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseData.id,
          activity_type: 'case_created',
          description: `Case file ${formData.caseNumber} created with ${selectedFiles.length} document(s)`,
          metadata: { 
            case_number: formData.caseNumber,
            document_count: selectedFiles.length
          },
        });

      toast({
        title: "Case File Created",
        description: `Case ${formData.caseNumber} has been successfully created.`,
      });

      // Reset form
      setFormData({
        caseNumber: '',
        title: '',
        description: '',
        victimName: '',
        suspectName: '',
        location: '',
        incidentDate: '',
        status: 'open',
        priority: 'medium',
      });
      setSelectedFiles([]);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Case File</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseNumber">Case Number</Label>
              <Input
                id="caseNumber"
                value={formData.caseNumber}
                readOnly
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief case description"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Case Description</Label>
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
              <Label htmlFor="victimName">Victim Name</Label>
              <Input
                id="victimName"
                value={formData.victimName}
                onChange={(e) => setFormData({ ...formData, victimName: e.target.value })}
                placeholder="Victim or complainant name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suspectName">Suspect Name</Label>
              <Input
                id="suspectName"
                value={formData.suspectName}
                onChange={(e) => setFormData({ ...formData, suspectName: e.target.value })}
                placeholder="Suspect name (if known)"
              />
            </div>
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
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: CasePriority) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: CaseStatus) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_investigation">Under Investigation</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Case Documents</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <div className="text-sm text-muted-foreground mb-2">
                    Upload case documents (letters, reports, etc.)
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Select Files
                  </Button>
                </div>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingFiles || !formData.title}>
              {loading ? 'Creating...' : uploadingFiles ? 'Uploading...' : 'Create Case File'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};