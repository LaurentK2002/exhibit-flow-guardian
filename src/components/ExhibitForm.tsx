import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type ExhibitType = Database['public']['Enums']['exhibit_type'];
type ExhibitStatus = Database['public']['Enums']['exhibit_status'];

export interface ExhibitFormData {
  exhibitType: ExhibitType;
  deviceName: string;
  brand: string;
  model: string;
  serialNumber: string;
  imei: string;
  macAddress: string;
  description: string;
  storageLocation: string;
  status: ExhibitStatus;
}

interface ExhibitFormProps {
  exhibit: ExhibitFormData;
  index: number;
  onChange: (index: number, field: keyof ExhibitFormData, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const ExhibitForm = ({ exhibit, index, onChange, onRemove, canRemove }: ExhibitFormProps) => {
  return (
    <div className="space-y-4 border rounded-lg p-4 relative">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Digital Exhibit #{index + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`exhibitType-${index}`}>Exhibit Type *</Label>
          <Select 
            value={exhibit.exhibitType} 
            onValueChange={(value: ExhibitType) => onChange(index, 'exhibitType', value)}
          >
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
          <Label htmlFor={`deviceName-${index}`}>Device Name *</Label>
          <Input
            id={`deviceName-${index}`}
            value={exhibit.deviceName}
            onChange={(e) => onChange(index, 'deviceName', e.target.value)}
            placeholder="e.g., iPhone 14 Pro"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`brand-${index}`}>
            Brand{exhibit.exhibitType === 'mobile_device' && ' *'}
          </Label>
          <Input
            id={`brand-${index}`}
            value={exhibit.brand}
            onChange={(e) => onChange(index, 'brand', e.target.value)}
            placeholder="e.g., Apple, Samsung"
            required={exhibit.exhibitType === 'mobile_device'}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`model-${index}`}>Model</Label>
          <Input
            id={`model-${index}`}
            value={exhibit.model}
            onChange={(e) => onChange(index, 'model', e.target.value)}
            placeholder="Model number"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`serialNumber-${index}`}>Serial Number</Label>
          <Input
            id={`serialNumber-${index}`}
            value={exhibit.serialNumber}
            onChange={(e) => onChange(index, 'serialNumber', e.target.value)}
            placeholder="Device serial number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`imei-${index}`}>
            IMEI{exhibit.exhibitType === 'mobile_device' ? ' *' : ' (Mobile devices)'}
          </Label>
          <Input
            id={`imei-${index}`}
            value={exhibit.imei}
            onChange={(e) => onChange(index, 'imei', e.target.value)}
            placeholder="IMEI number"
            required={exhibit.exhibitType === 'mobile_device'}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`macAddress-${index}`}>MAC Address</Label>
          <Input
            id={`macAddress-${index}`}
            value={exhibit.macAddress}
            onChange={(e) => onChange(index, 'macAddress', e.target.value)}
            placeholder="Network MAC address"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`description-${index}`}>Exhibit Description</Label>
        <Textarea
          id={`description-${index}`}
          value={exhibit.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder="Detailed description of the exhibit and circumstances of seizure..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`storageLocation-${index}`}>Storage Location</Label>
          <Input
            id={`storageLocation-${index}`}
            value={exhibit.storageLocation}
            onChange={(e) => onChange(index, 'storageLocation', e.target.value)}
            placeholder="e.g., Vault A-201"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`status-${index}`}>Exhibit Status</Label>
          <Select 
            value={exhibit.status} 
            onValueChange={(value: ExhibitStatus) => onChange(index, 'status', value)}
          >
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
  );
};