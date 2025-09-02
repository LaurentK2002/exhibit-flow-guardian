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

type ExhibitType = Database['public']['Enums']['exhibit_type'];
type ExhibitStatus = Database['public']['Enums']['exhibit_status'];

interface Case {
  id: string;
  case_number: string;
  title: string;
}

interface AddExhibitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddExhibitDialog = ({ open, onOpenChange, onSuccess }: AddExhibitDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    caseId: '',
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

  useEffect(() => {
    if (open) {
      fetchCases();
    }
  }, [open]);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, title')
        .in('status', ['open', 'under_investigation'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const exhibitNumber = await generateExhibitNumber();
      
      const { error } = await supabase
        .from('exhibits')
        .insert({
          exhibit_number: exhibitNumber,
          case_id: formData.caseId,
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
        });

      if (error) throw error;

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: formData.caseId,
          activity_type: 'exhibit_received',
          description: `New digital exhibit "${formData.deviceName}" (${exhibitNumber}) received and logged into evidence system`,
          metadata: { 
            exhibit_number: exhibitNumber,
            exhibit_type: formData.exhibitType,
            device_name: formData.deviceName 
          },
        });

      toast({
        title: "Exhibit Added",
        description: `Exhibit ${exhibitNumber} has been successfully logged.`,
      });

      // Reset form
      setFormData({
        caseId: '',
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Digital Exhibit</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseId">Case *</Label>
              <Select value={formData.caseId} onValueChange={(value) => setFormData({ ...formData, caseId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((case_) => (
                    <SelectItem key={case_.id} value={case_.id}>
                      {case_.case_number} - {case_.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Label htmlFor="description">Description</Label>
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
              <Label htmlFor="status">Status</Label>
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.caseId}>
              {loading ? 'Adding...' : 'Add Exhibit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};