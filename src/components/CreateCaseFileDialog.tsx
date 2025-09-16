import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { Upload, FileText, X } from 'lucide-react';

type CaseStatus = Database['public']['Enums']['case_status'];
type CasePriority = Database['public']['Enums']['case_priority'];

interface CreateCaseFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateCaseFileDialog = ({ open, onOpenChange, onSuccess }: CreateCaseFileDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const currentYear = new Date().getFullYear();
    
    // Get the latest case number for current year
    const { data } = await supabase
      .from('cases')
      .select('case_number')
      .like('case_number', `FB/CYBER/${currentYear}/%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].case_number.split('/').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `FB/CYBER/${currentYear}/${nextNumber.toString().padStart(4, '0')}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDocuments = async (caseId: string) => {
    const uploadPromises = uploadedFiles.map(async (file) => {
      const fileName = `${caseId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('case-documents')
        .upload(fileName, file);
      
      if (error) {
        console.error('Error uploading file:', error);
        return null;
      }
      
      return {
        name: file.name,
        path: data.path,
        size: file.size,
        type: file.type,
      };
    });

    const results = await Promise.all(uploadPromises);
    return results.filter(result => result !== null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const caseNumber = formData.caseNumber || await generateCaseNumber();
      
      // Create the case
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          case_number: caseNumber,
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
      let uploadedDocuments = [];
      if (uploadedFiles.length > 0) {
        uploadedDocuments = await uploadDocuments(caseData.id);
      }

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseData.id,
          activity_type: 'case_created',
          description: `Case file "${formData.title}" (${caseNumber}) created with ${uploadedFiles.length} documents`,
          metadata: { 
            case_number: caseNumber,
            documents_count: uploadedFiles.length,
            uploaded_documents: uploadedDocuments
          },
        });

      toast({
        title: "Case File Created",
        description: `Case ${caseNumber} has been successfully created with ${uploadedFiles.length} documents.`,
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
      setUploadedFiles([]);

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
          <DialogTitle>Create Case File</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseNumber">Case Number (auto-generated if empty)</Label>
              <Input
                id="caseNumber"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                placeholder="FB/CYBER/2025/0001"
              />
            </div>
            
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the case..."
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
                placeholder="Name of the victim"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suspectName">Suspect Name</Label>
              <Input
                id="suspectName"
                value={formData.suspectName}
                onChange={(e) => setFormData({ ...formData, suspectName: e.target.value })}
                placeholder="Name of the suspect"
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
                placeholder="Location of the incident"
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
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: CaseStatus) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_investigation">Under Investigation</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Document Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Case Documents</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              className="hidden"
            />

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Selected Files ({uploadedFiles.length})
                </Label>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
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
            <Button type="submit" disabled={loading || !formData.title}>
              {loading ? 'Creating...' : 'Create Case File'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};