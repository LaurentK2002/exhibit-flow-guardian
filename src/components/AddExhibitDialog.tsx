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

type ExhibitType = Database['public']['Enums']['exhibit_type'];
type ExhibitStatus = Database['public']['Enums']['exhibit_status'];
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
  
  const [formData, setFormData] = useState({
    // Case Information
    caseNumber: '',
    caseTitle: '',
    caseDescription: '',
    location: '',
    caseStatus: 'open' as CaseStatus,
    casePriority: 'medium' as CasePriority,
    // Investigation Report Information
    irNumber: '',
    referenceNumber: '',
    // Exhibit Information
    exhibitType: 'mobile_device' as ExhibitType,
    deviceName: '',
    brand: '',
    model: '',
    serialNumber: '',
    imei: '',
    macAddress: '',
    description: '',
    storageLocation: '',
    status: 'received' as ExhibitStatus,
  });

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
        setFormData(prev => ({ ...prev, caseNumber }));
      });
    }
  }, [open]);

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
      // First create the case file
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert({
          case_number: formData.caseNumber,
          title: formData.caseTitle,
          description: formData.caseDescription,
          location: formData.location || null,
          status: formData.caseStatus,
          priority: formData.casePriority,
          exhibit_officer_id: user?.id,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Generate exhibit and lab numbers
      const exhibitNumber = await generateExhibitNumber();
      const labNumber = await generateLabNumber();
      
      // Create the exhibit linked to the new case
      const { error: exhibitError } = await supabase
        .from('exhibits')
        .insert({
          exhibit_number: exhibitNumber,
          lab_number: labNumber,
          case_id: caseData.id,
          exhibit_type: formData.exhibitType,
          device_name: formData.deviceName,
          brand: formData.brand || null,
          model: formData.model || null,
          serial_number: formData.serialNumber || null,
          imei: formData.imei || null,
          mac_address: formData.macAddress || null,
          description: formData.description || null,
          storage_location: formData.storageLocation || null,
          status: formData.status,
          received_by: user?.id,
        });

      if (exhibitError) throw exhibitError;

      // Log case creation activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseData.id,
          activity_type: 'case_created',
          description: `Case file ${formData.caseNumber} created with digital exhibit registration`,
          metadata: { 
            case_number: formData.caseNumber,
            ir_number: formData.irNumber,
            reference_number: formData.referenceNumber
          },
        });

      // Log exhibit received activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseData.id,
          activity_type: 'exhibit_received',
          description: `Digital exhibit "${formData.deviceName}" (${exhibitNumber}) with lab number ${labNumber} received and logged into evidence system`,
          metadata: { 
            exhibit_number: exhibitNumber,
            lab_number: labNumber,
            exhibit_type: formData.exhibitType,
            device_name: formData.deviceName,
            ir_number: formData.irNumber,
            reference_number: formData.referenceNumber
          },
        });

      toast({
        title: "Case File and Exhibit Created",
        description: `Case ${formData.caseNumber} created with exhibit ${exhibitNumber} (Lab: ${labNumber}).`,
      });

      // Reset form
      setFormData({
        caseNumber: '',
        caseTitle: '',
        caseDescription: '',
        location: '',
        caseStatus: 'open',
        casePriority: 'medium',
        irNumber: '',
        referenceNumber: '',
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
                <Label htmlFor="caseNumber">Case Number</Label>
                <Input
                  id="caseNumber"
                  value={formData.caseNumber}
                  readOnly
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="caseTitle">Case Title *</Label>
                <Input
                  id="caseTitle"
                  value={formData.caseTitle}
                  onChange={(e) => setFormData({ ...formData, caseTitle: e.target.value })}
                  placeholder="Brief case description"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseDescription">Case Description</Label>
              <Textarea
                id="caseDescription"
                value={formData.caseDescription}
                onChange={(e) => setFormData({ ...formData, caseDescription: e.target.value })}
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
                <Label htmlFor="casePriority">Priority</Label>
                <Select value={formData.casePriority} onValueChange={(value: CasePriority) => setFormData({ ...formData, casePriority: value })}>
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
                  value={formData.irNumber}
                  onChange={(e) => setFormData({ ...formData, irNumber: e.target.value })}
                  placeholder="e.g., IR/2024/0001"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number *</Label>
                <Input
                  id="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="e.g., REF/CCU/2024/001"
                  required
                />
              </div>
            </div>
          </div>

          {/* Digital Exhibit Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Digital Exhibit Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exhibitType">Exhibit Type *</Label>
                <Select value={formData.exhibitType} onValueChange={(value: ExhibitType) => setFormData({ ...formData, exhibitType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_device">Mobile Device</SelectItem>
                    <SelectItem value="computer">Computer</SelectItem>
                    <SelectItem value="storage_media">Storage Media</SelectItem>
                    <SelectItem value="network_device">Network Device</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name *</Label>
                <Input
                  id="deviceName"
                  value={formData.deviceName}
                  onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                  placeholder="e.g., iPhone 14 Pro"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Apple, Samsung"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Model number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Device serial number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imei">IMEI (Mobile devices)</Label>
                <Input
                  id="imei"
                  value={formData.imei}
                  onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                  placeholder="IMEI number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="macAddress">MAC Address</Label>
                <Input
                  id="macAddress"
                  value={formData.macAddress}
                  onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                  placeholder="Network MAC address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Exhibit Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the exhibit and circumstances of seizure..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storageLocation">Storage Location</Label>
                <Input
                  id="storageLocation"
                  value={formData.storageLocation}
                  onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  placeholder="e.g., Vault A-201"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Exhibit Status</Label>
                <Select value={formData.status} onValueChange={(value: ExhibitStatus) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="in_analysis">In Analysis</SelectItem>
                    <SelectItem value="analysis_complete">Analysis Complete</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                    <SelectItem value="destroyed">Destroyed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.caseTitle || !formData.irNumber || !formData.referenceNumber || !formData.deviceName}>
              {loading ? 'Creating...' : 'Create Case & Register Exhibit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};