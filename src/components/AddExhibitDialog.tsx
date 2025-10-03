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
  const { user, profile } = useAuth();
  
  const [caseFormData, setCaseFormData] = useState({
    caseNumber: '',
    caseTitle: '',
    fromDesignation: 'DCI',
    customDesignation: '',
    caseStatus: 'open' as CaseStatus,
    casePriority: 'medium' as CasePriority,
    irNumber: '',
    referenceNumber: '',
    numberOfExhibits: 1,
  });

  const [exhibits, setExhibits] = useState<ExhibitFormData[]>([{
    exhibitType: '' as any,
    deviceName: '',
    brand: '',
    model: '',
    serialNumber: '',
    imei: '',
    macAddress: '',
    hasSim: 'NO',
    simCards: [{ simCardName: '', iccid: '' }],
    description: '',
    storageLocation: '',
    status: 'received',
    computerType: '',
    internalStorageType: '',
    internalStorageBrand: '',
    internalStorageModel: '',
    internalStorageSerialNumber: '',
    internalStorageCapacity: '',
  }]);

  const [referenceLetterFile, setReferenceLetterFile] = useState<File | null>(null);

  const getAvailablePriorities = () => {
    const userRole = profile?.role;
    
    // CO can set all priorities including urgent
    if (userRole === 'commanding_officer') {
      return [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ];
    }
    
    // OCU can set high, medium, and low
    if (userRole === 'officer_commanding_unit') {
      return [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ];
    }
    
    // Exhibit officers and others can only set medium and low
    return [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
    ];
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

  useEffect(() => {
    if (open) {
      generateLabNumber().then(labNumber => {
        setCaseFormData(prev => ({ ...prev, caseNumber: labNumber || '' }));
      });
    }
  }, [open]);

  const addExhibit = () => {
    setExhibits([...exhibits, {
      exhibitType: '' as any,
      deviceName: '',
      brand: '',
      model: '',
      serialNumber: '',
      imei: '',
      macAddress: '',
      hasSim: 'NO',
      simCards: [{ simCardName: '', iccid: '' }],
      description: '',
      storageLocation: '',
      status: 'received',
      computerType: '',
      internalStorageType: '',
      internalStorageBrand: '',
      internalStorageModel: '',
      internalStorageSerialNumber: '',
      internalStorageCapacity: '',
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
      // Check file size (10MB limit for better performance)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB. Please select a smaller file.",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF, DOC, DOCX, JPG, or PNG file.",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      setReferenceLetterFile(file);
      toast({
        title: "File Selected",
        description: `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    }
  };

  const generateExhibitNumber = async (caseLabNumber: string) => {
    // New format: CYB/LAB/(LAB NO)/A1, A2, A3, etc.
    const { data } = await supabase
      .from('exhibits')
      .select('exhibit_number')
      .like('exhibit_number', `CYB/LAB/${caseLabNumber}/A%`)
      .order('created_at', { ascending: false });

    let nextNumber = 1;
    if (data && data.length > 0) {
      // Find the highest A number for this lab number
      const numbers = data
        .map(exhibit => {
          const match = exhibit.exhibit_number.match(/\/A(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => num > 0);
      
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    return `CYB/LAB/${caseLabNumber}/A${nextNumber}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload reference letter file if provided
      let referenceLetterPath = null;
      if (referenceLetterFile) {
        try {
          const fileExt = referenceLetterFile.name.split('.').pop();
          const fileName = `reference-letters/${caseFormData.caseNumber}-${Date.now()}-reference-letter.${fileExt}`;
          
          toast({
            title: "Uploading File",
            description: "Uploading reference letter...",
          });
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('case-documents')
            .upload(fileName, referenceLetterFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`File upload failed: ${uploadError.message}`);
          }
          
          referenceLetterPath = uploadData.path;
          
          toast({
            title: "File Uploaded Successfully",
            description: `Reference letter uploaded: ${referenceLetterFile.name}`,
          });
        } catch (uploadErr: any) {
          console.error('File upload error:', uploadErr);
          throw new Error(`Failed to upload reference letter: ${uploadErr.message}`);
        }
      }

      // First create the case file
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          case_number: caseFormData.caseNumber,
          lab_number: caseFormData.caseNumber, // Lab number is the primary identifier
          title: caseFormData.caseTitle,
          description: `From: ${caseFormData.fromDesignation === 'Other' ? caseFormData.customDesignation : caseFormData.fromDesignation}`,
          status: caseFormData.caseStatus,
          priority: caseFormData.casePriority,
          exhibit_officer_id: user?.id,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Create all exhibits linked to the new case
      const exhibitPromises = exhibits.map(async (exhibit) => {
        const exhibitNumber = await generateExhibitNumber(caseData.lab_number || caseData.case_number);
        
        const { error: exhibitError } = await supabase
          .from('exhibits')
          .insert({
            exhibit_number: exhibitNumber,
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
            description: `Digital exhibit "${exhibit.deviceName}" (${exhibitNumber}) received and logged into evidence system for case ${caseData.case_number}`,
            metadata: { 
              exhibit_number: exhibitNumber,
              case_lab_number: caseData.lab_number,
              exhibit_type: exhibit.exhibitType,
              device_name: exhibit.deviceName,
              ir_number: caseFormData.irNumber,
              reference_number: caseFormData.referenceNumber,
              reference_letter_path: referenceLetterPath
            },
          });

        return { exhibitNumber };
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

      const exhibitsList = createdExhibits.map(ex => ex.exhibitNumber).join(', ');
      
      toast({
        title: "Case File and Exhibits Created",
        description: `Case ${caseFormData.caseNumber} created with ${exhibits.length} exhibit(s): ${exhibitsList}`,
      });

      // Reset form
      setCaseFormData({
        caseNumber: '',
        caseTitle: '',
        fromDesignation: 'DCI',
        customDesignation: '',
        caseStatus: 'open',
        casePriority: 'medium',
        irNumber: '',
        referenceNumber: '',
        numberOfExhibits: 1,
      });

      setExhibits([{
        exhibitType: 'mobile_device',
        deviceName: '',
        brand: '',
        model: '',
        serialNumber: '',
        imei: '',
        macAddress: '',
        hasSim: 'NO',
        simCards: [{ simCardName: '', iccid: '' }],
        description: '',
        storageLocation: '',
        status: 'received',
        computerType: '',
        internalStorageType: '',
        internalStorageBrand: '',
        internalStorageModel: '',
        internalStorageSerialNumber: '',
        internalStorageCapacity: '',
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
          <DialogTitle>Create Case File</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Information Section */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-lg font-semibold">Case Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseNumber">Lab Number (Auto-generated)</Label>
                <Input
                  id="caseNumber"
                  value={caseFormData.caseNumber}
                  readOnly
                  className="bg-muted font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  This is the primary case identifier automatically generated by the system
                </p>
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

              <div className="space-y-2">
                <Label htmlFor="numberOfExhibits">Number of Digital Exhibits *</Label>
                <Input
                  id="numberOfExhibits"
                  type="number"
                  min="1"
                  max="50"
                  value={caseFormData.numberOfExhibits}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 1;
                    setCaseFormData({ ...caseFormData, numberOfExhibits: count });
                    
                    // Automatically adjust exhibits array
                    const currentCount = exhibits.length;
                    if (count > currentCount) {
                      // Add more exhibits
                      const newExhibits = Array(count - currentCount).fill(null).map(() => ({
                        exhibitType: '' as any,
                        deviceName: '',
                        brand: '',
                        model: '',
                        serialNumber: '',
                        imei: '',
                        macAddress: '',
                        hasSim: 'NO',
                        simCards: [{ simCardName: '', iccid: '' }],
                        description: '',
                        storageLocation: '',
                        status: 'received' as const,
                        computerType: '',
                        internalStorageType: '',
                        internalStorageBrand: '',
                        internalStorageModel: '',
                        internalStorageSerialNumber: '',
                        internalStorageCapacity: '',
                      }));
                      setExhibits([...exhibits, ...newExhibits]);
                    } else if (count < currentCount) {
                      // Remove extra exhibits
                      setExhibits(exhibits.slice(0, count));
                    }
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Specify how many exhibits to register (1-50)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromDesignation">From *</Label>
              <Select 
                value={caseFormData.fromDesignation} 
                onValueChange={(value) => setCaseFormData({ ...caseFormData, fromDesignation: value, customDesignation: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DCI">DCI</SelectItem>
                  <SelectItem value="ZCO">ZCO</SelectItem>
                  <SelectItem value="RCO">RCO</SelectItem>
                  <SelectItem value="OC-CID">OC-CID</SelectItem>
                  <SelectItem value="DCEA">DCEA</SelectItem>
                  <SelectItem value="DCO">DCO</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {caseFormData.fromDesignation === 'Other' && (
                <Input
                  placeholder="Enter designation"
                  value={caseFormData.customDesignation}
                  onChange={(e) => setCaseFormData({ ...caseFormData, customDesignation: e.target.value })}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="casePriority">Priority</Label>
              <Select value={caseFormData.casePriority} onValueChange={(value: CasePriority) => setCaseFormData({ ...caseFormData, casePriority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailablePriorities().map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {profile?.role === 'exhibit_officer' && (
                <p className="text-xs text-muted-foreground">
                  Note: Only Commanding Officers can set "Urgent" priority and Officer Commanding Units can set "High" priority.
                </p>
              )}
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
              {referenceLetterFile && (
                <p className="text-sm text-green-600">
                  ✓ Selected: {referenceLetterFile.name} ({(referenceLetterFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Upload the reference letter from the station where the exhibit originates. Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max: 50MB)
              </p>
            </div>
          </div>

          {/* Digital Exhibits Information Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Digital Exhibits Information ({exhibits.length} exhibit{exhibits.length > 1 ? 's' : ''})
              </h3>
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
                  caseLabNumber={caseFormData.caseNumber}
                  totalExhibits={exhibits.length}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                loading || 
                !caseFormData.caseTitle || 
                !caseFormData.irNumber || 
                !caseFormData.referenceNumber || 
                !caseFormData.numberOfExhibits ||
                caseFormData.numberOfExhibits < 1 ||
                !referenceLetterFile || 
                (caseFormData.fromDesignation === 'Other' && !caseFormData.customDesignation) || 
                exhibits.some(ex => {
                  // Basic validation - device name is always required
                  if (!ex.deviceName) return true;
                  
                  // Mobile Device - requires brand, IMEI, hasSim selection, and all SIM cards filled if present
                  if (ex.exhibitType === 'mobile_device') {
                    if (!ex.brand || !ex.imei || !ex.hasSim) return true;
                    if (ex.hasSim === 'YES' && ex.simCards.some(sim => !sim.simCardName || !sim.iccid)) return true;
                  }
                  
                  // Computer - requires all computer fields including internal storage details
                  if (ex.exhibitType === 'computer' && (
                    !ex.computerType || 
                    !ex.brand || 
                    !ex.model || 
                    !ex.serialNumber || 
                    !ex.internalStorageType ||
                    !ex.internalStorageBrand ||
                    !ex.internalStorageModel ||
                    !ex.internalStorageSerialNumber ||
                    !ex.internalStorageCapacity
                  )) return true;
                  
                  // Storage Media - requires brand and serial number
                  if (ex.exhibitType === 'storage_media' && (!ex.brand || !ex.serialNumber)) return true;
                  
                  // Network Device - requires brand and MAC address
                  if (ex.exhibitType === 'network_device' && (!ex.brand || !ex.macAddress)) return true;
                  
                  return false;
                })
              }
            >
              {loading ? 'Creating...' : 'Create Case File'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};