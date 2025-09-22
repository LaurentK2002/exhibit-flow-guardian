import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { ExhibitForm, ExhibitFormData } from './ExhibitForm';
import { Plus, Upload } from 'lucide-react';

type CaseStatus = Database['public']['Enums']['case_status'];
type CasePriority = Database['public']['Enums']['case_priority'];

interface AddExhibitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddExhibitDialog = ({ open, onOpenChange, onSuccess }: AddExhibitDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [caseFormData, setCaseFormData] = useState({
    caseNumber: '',
    caseTitle: '',
    caseDescription: '',
    location: '',
    caseStatus: 'open' as CaseStatus,
    casePriority: 'medium' as CasePriority,
    irNumber: '',
    referenceNumber: '',
  });

  const [exhibits, setExhibits] = useState<ExhibitFormData[]>([{
    exhibitType: 'mobile_device',
    deviceName: '',
    brand: '',
    model: '',
    serialNumber: '',
    imei: '',
    macAddress: '',
    description: '',
    storageLocation: '',
    status: 'received',
  }]);

  const [referenceLetterFile, setReferenceLetterFile] = useState<File | null>(null);

  const generateCaseNumber = async () => {
    // Generate lab number format for case number  
    const currentYear = new Date().getFullYear();
    const { data } = await supabase
      .from('cases')
      .select('case_number')
      .like('case_number', `FB/CYBER/${currentYear}/LAB/%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastLabNumber = data[0].case_number;
      const match = lastLabNumber.match(/LAB\/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `FB/CYBER/${currentYear}/LAB/${nextNumber.toString().padStart(4, '0')}`;
  };

  useEffect(() => {
    if (open) {
      generateCaseNumber().then(caseNumber => {
        setCaseFormData(prev => ({ ...prev, caseNumber }));
      });
    }
  }, [open]);

  const addExhibit = () => {
    setExhibits([...exhibits, {
      exhibitType: 'mobile_device',
      deviceName: '',
      brand: '',
      model: '',
      serialNumber: '',
      imei: '',
      macAddress: '',
      description: '',
      storageLocation: '',
      status: 'received',
    }]);
  };

  const removeExhibit = (index: number) => {
    setExhibits(exhibits.filter((_, i) => i !== index));
  };

  const updateExhibit = (index: number, field: keyof ExhibitFormData, value: string) => {
    setExhibits(exhibits.map((exhibit, i) => 
      i === index ? { ...exhibit, [field]: value } : exhibit
    ));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceLetterFile(file);
    }
  };

  const generateExhibitNumber = async () => {
    // Get the latest exhibit number
    const { data } = await supabase
      .from('exhibits')
      .select('exhibit_number')
      .like('exhibit_number', 'EXH-%')
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].exhibit_number.split('-')[1]) || 0;
      nextNumber = lastNumber + 1;
    }

    return `EXH-${nextNumber.toString().padStart(4, '0')}`;
  };

  const generateLabNumber = async () => {
    // Get the latest lab number for the current year
    const currentYear = new Date().getFullYear();
    const { data } = await supabase
      .from('exhibits')
      .select('lab_number')
      .like('lab_number', `FB/CYBER/${currentYear}/LAB/%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastLabNumber = data[0].lab_number;
      const match = lastLabNumber.match(/LAB\/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `FB/CYBER/${currentYear}/LAB/${nextNumber.toString().padStart(4, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload reference letter file if provided
      let referenceLetterPath = null;
      if (referenceLetterFile) {
        const fileExt = referenceLetterFile.name.split('.').pop();
        const fileName = `${Date.now()}-reference-letter.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('case-documents')
          .upload(fileName, referenceLetterFile);

        if (uploadError) throw uploadError;
        referenceLetterPath = uploadData.path;
      }

      // First create the case file
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          case_number: caseFormData.caseNumber,
          title: caseFormData.caseTitle,
          description: caseFormData.caseDescription,
          location: caseFormData.location || null,
          status: caseFormData.caseStatus,
          priority: caseFormData.casePriority,
          exhibit_officer_id: user?.id,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Create all exhibits linked to the new case
      const exhibitPromises = exhibits.map(async (exhibit) => {
        const exhibitNumber = await generateExhibitNumber();
        const labNumber = await generateLabNumber();
        
        const { error: exhibitError } = await supabase
          .from('exhibits')
          .insert({
            exhibit_number: exhibitNumber,
            lab_number: labNumber,
            case_id: caseData.id,
            exhibit_type: exhibit.exhibitType,
            device_name: exhibit.deviceName,
            brand: exhibit.brand || null,
            model: exhibit.model || null,
            serial_number: exhibit.serialNumber || null,
            imei: exhibit.imei || null,
            mac_address: exhibit.macAddress || null,
            description: exhibit.description || null,
            storage_location: exhibit.storageLocation || null,
            status: exhibit.status,
            received_by: user?.id,
          });

        if (exhibitError) throw exhibitError;

        // Log exhibit received activity
        await supabase
          .from('case_activities')
          .insert({
            case_id: caseData.id,
            activity_type: 'exhibit_received',
            description: `Digital exhibit "${exhibit.deviceName}" (${exhibitNumber}) with lab number ${labNumber} received and logged into evidence system`,
            metadata: { 
              exhibit_number: exhibitNumber,
              lab_number: labNumber,
              exhibit_type: exhibit.exhibitType,
              device_name: exhibit.deviceName,
              ir_number: caseFormData.irNumber,
              reference_number: caseFormData.referenceNumber,
              reference_letter_path: referenceLetterPath
            },
          });

        return { exhibitNumber, labNumber };
      });

      const createdExhibits = await Promise.all(exhibitPromises);

      // Log case creation activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseData.id,
          activity_type: 'case_created',
          description: `Case file ${caseFormData.caseNumber} created with ${exhibits.length} digital exhibit(s) registration`,
          metadata: { 
            case_number: caseFormData.caseNumber,
            ir_number: caseFormData.irNumber,
            reference_number: caseFormData.referenceNumber,
            exhibits_count: exhibits.length,
            reference_letter_path: referenceLetterPath
          },
        });

      const exhibitsList = createdExhibits.map(ex => `${ex.exhibitNumber} (Lab: ${ex.labNumber})`).join(', ');
      
      toast({
        title: "Case File and Exhibits Created",
        description: `Case ${caseFormData.caseNumber} created with ${exhibits.length} exhibit(s): ${exhibitsList}`,
      });

      // Reset form
      setCaseFormData({
        caseNumber: '',
        caseTitle: '',
        caseDescription: '',
        location: '',
        caseStatus: 'open',
        casePriority: 'medium',
        irNumber: '',
        referenceNumber: '',
      });

      setExhibits([{
        exhibitType: 'mobile_device',
        deviceName: '',
        brand: '',
        model: '',
        serialNumber: '',
        imei: '',
        macAddress: '',
        description: '',
        storageLocation: '',
        status: 'received',
      }]);

      setReferenceLetterFile(null);
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
          <DialogTitle>Create Case File & Register Digital Exhibit</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Information Section */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-lg font-semibold">Case Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseNumber">Case Number (Lab Number)</Label>
                <Input
                  id="caseNumber"
                  value={caseFormData.caseNumber}
                  readOnly
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="caseTitle">Case Title *</Label>
                <Input
                  id="caseTitle"
                  value={caseFormData.caseTitle}
                  onChange={(e) => setCaseFormData({ ...caseFormData, caseTitle: e.target.value })}
                  placeholder="Brief case description"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseDescription">Case Description</Label>
              <Textarea
                id="caseDescription"
                value={caseFormData.caseDescription}
                onChange={(e) => setCaseFormData({ ...caseFormData, caseDescription: e.target.value })}
                placeholder="Detailed case description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={caseFormData.location}
                  onChange={(e) => setCaseFormData({ ...caseFormData, location: e.target.value })}
                  placeholder="Incident location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="casePriority">Priority</Label>
                <Select value={caseFormData.casePriority} onValueChange={(value: CasePriority) => setCaseFormData({ ...caseFormData, casePriority: value })}>
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
            </div>
          </div>

          {/* Investigation Report Information Section */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-lg font-semibold">Investigation Report Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="irNumber">IR (Investigation Report) Number *</Label>
                <Input
                  id="irNumber"
                  value={caseFormData.irNumber}
                  onChange={(e) => setCaseFormData({ ...caseFormData, irNumber: e.target.value })}
                  placeholder="e.g., IR/2024/0001"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number *</Label>
                <Input
                  id="referenceNumber"
                  value={caseFormData.referenceNumber}
                  onChange={(e) => setCaseFormData({ ...caseFormData, referenceNumber: e.target.value })}
                  placeholder="e.g., REF/CCU/2024/001"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Reference Letter from Station *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  required
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Upload the reference letter from the station where the exhibit originates. Accepted formats: PDF, DOC, DOCX, JPG, PNG
              </p>
            </div>
          </div>

          {/* Digital Exhibits Information Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Digital Exhibits Information</h3>
              <Button type="button" onClick={addExhibit} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Exhibit
              </Button>
            </div>

            <div className="space-y-6">
              {exhibits.map((exhibit, index) => (
                <ExhibitForm
                  key={index}
                  exhibit={exhibit}
                  index={index}
                  onChange={updateExhibit}
                  onRemove={removeExhibit}
                  canRemove={exhibits.length > 1}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !caseFormData.caseTitle || !caseFormData.irNumber || !caseFormData.referenceNumber || !referenceLetterFile || exhibits.some(ex => !ex.deviceName)}>
              {loading ? 'Creating...' : `Create Case & Register ${exhibits.length} Exhibit${exhibits.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};