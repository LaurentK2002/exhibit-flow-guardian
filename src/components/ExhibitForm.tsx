import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
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
  hasSim: string;
  simCards: Array<{ simCardName: string; iccid: string }>;
  description: string;
  status: ExhibitStatus;
  computerType: string;
  internalStorageType: string;
  internalStorageBrand: string;
  internalStorageModel: string;
  internalStorageSerialNumber: string;
  internalStorageCapacity: string;
}

interface ExhibitFormProps {
  exhibit: ExhibitFormData;
  index: number;
  onChange: (index: number, field: keyof ExhibitFormData, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  caseLabNumber?: string;
  totalExhibits?: number;
}

export const ExhibitForm = ({ exhibit, index, onChange, onRemove, canRemove, caseLabNumber, totalExhibits = 1 }: ExhibitFormProps) => {
  // Define required fields for each device type
  const isMobileDevice = exhibit.exhibitType === 'mobile_device';
  const isComputer = exhibit.exhibitType === 'computer';
  const isStorageMedia = exhibit.exhibitType === 'storage_media';
  const isNetworkDevice = exhibit.exhibitType === 'network_device';

  // Extract #### from case lab number (format: FB/CYBER/YYYY/LAB/####)
  const extractLabSequence = (labNumber: string | undefined) => {
    if (!labNumber) return '0000';
    const match = labNumber.match(/LAB\/(\d{4})$/);
    return match ? match[1] : '0000';
  };

  const labSequence = extractLabSequence(caseLabNumber);
  
  // If only one exhibit, use "A", otherwise use "A1", "A2", etc.
  const exhibitSuffix = totalExhibits === 1 ? 'A' : `A${index + 1}`;
  const exhibitNumber = `CYB/LAB/${labSequence}/${exhibitSuffix}`;

  const addSimCard = () => {
    onChange(index, 'simCards', [...exhibit.simCards, { simCardName: '', iccid: '' }]);
  };

  const removeSimCard = (simIndex: number) => {
    const newSimCards = exhibit.simCards.filter((_, i) => i !== simIndex);
    onChange(index, 'simCards', newSimCards);
  };

  const updateSimCard = (simIndex: number, field: 'simCardName' | 'iccid', value: string) => {
    const newSimCards = [...exhibit.simCards];
    newSimCards[simIndex] = { ...newSimCards[simIndex], [field]: value };
    onChange(index, 'simCards', newSimCards);
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 relative">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold font-mono">{exhibitNumber}</h4>
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

      {/* Show Device Name and specific fields only after exhibit type is selected */}
      {exhibit.exhibitType && (
        <>
          {/* Computer Type - Shows before Device Name for computers */}
          {isComputer && (
            <div className="space-y-2">
              <Label htmlFor={`computerType-${index}`}>Computer Type *</Label>
              <Select 
                value={exhibit.computerType} 
                onValueChange={(value) => onChange(index, 'computerType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select computer type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="all-in-one">All-in-one PC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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

          {/* Mobile Device Specific Fields */}
          {isMobileDevice && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`brand-${index}`}>Brand *</Label>
                  <Input
                    id={`brand-${index}`}
                    value={exhibit.brand}
                    onChange={(e) => onChange(index, 'brand', e.target.value)}
                    placeholder="e.g., Apple, Samsung"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`imei-${index}`}>IMEI *</Label>
                  <Input
                    id={`imei-${index}`}
                    value={exhibit.imei}
                    onChange={(e) => onChange(index, 'imei', e.target.value)}
                    placeholder="IMEI number"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor={`hasSim-${index}`}>Contains SIM Card *</Label>
                  <Select 
                    value={exhibit.hasSim} 
                    onValueChange={(value) => onChange(index, 'hasSim', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO">NO</SelectItem>
                      <SelectItem value="YES">YES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {exhibit.hasSim === 'YES' && (
                <>
                  {exhibit.simCards.map((sim, simIndex) => (
                    <div key={simIndex} className="space-y-4 border-l-2 border-primary pl-4">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">SIM Card {simIndex + 1}</h5>
                        {exhibit.simCards.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSimCard(simIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`simCardName-${index}-${simIndex}`}>SIM Card Name *</Label>
                          <Input
                            id={`simCardName-${index}-${simIndex}`}
                            value={sim.simCardName}
                            onChange={(e) => updateSimCard(simIndex, 'simCardName', e.target.value)}
                            placeholder="e.g., Vodacom, Airtel"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`iccid-${index}-${simIndex}`}>ICCID Number *</Label>
                          <Input
                            id={`iccid-${index}-${simIndex}`}
                            value={sim.iccid}
                            onChange={(e) => updateSimCard(simIndex, 'iccid', e.target.value)}
                            placeholder="SIM card ICCID number"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSimCard}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another SIM Card
                  </Button>
                </>
              )}
            </>
          )}

          {/* Computer Specific Fields */}
          {isComputer && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`brand-${index}`}>Brand *</Label>
                  <Input
                    id={`brand-${index}`}
                    value={exhibit.brand}
                    onChange={(e) => onChange(index, 'brand', e.target.value)}
                    placeholder="e.g., Dell, HP, Apple"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`model-${index}`}>Model *</Label>
                  <Input
                    id={`model-${index}`}
                    value={exhibit.model}
                    onChange={(e) => onChange(index, 'model', e.target.value)}
                    placeholder="Model number"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`serialNumber-${index}`}>Serial Number *</Label>
                  <Input
                    id={`serialNumber-${index}`}
                    value={exhibit.serialNumber}
                    onChange={(e) => onChange(index, 'serialNumber', e.target.value)}
                    placeholder="Device serial number"
                    required
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
                <Label htmlFor={`internalStorageType-${index}`}>Internal Storage Media Type *</Label>
                <Select 
                  value={exhibit.internalStorageType} 
                  onValueChange={(value) => onChange(index, 'internalStorageType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hdd">HDD (Hard Disk Drive)</SelectItem>
                    <SelectItem value="ssd">SSD (Solid State Drive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Internal Storage Media Details */}
              <div className="border-l-2 border-primary pl-4 space-y-4">
                <h5 className="font-medium text-sm">Internal Storage Media Information</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`internalStorageBrand-${index}`}>Storage Brand *</Label>
                    <Input
                      id={`internalStorageBrand-${index}`}
                      value={exhibit.internalStorageBrand}
                      onChange={(e) => onChange(index, 'internalStorageBrand', e.target.value)}
                      placeholder="e.g., Samsung, Western Digital"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`internalStorageModel-${index}`}>Storage Model *</Label>
                    <Input
                      id={`internalStorageModel-${index}`}
                      value={exhibit.internalStorageModel}
                      onChange={(e) => onChange(index, 'internalStorageModel', e.target.value)}
                      placeholder="e.g., 860 EVO, WD Blue"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`internalStorageSerialNumber-${index}`}>Storage Serial Number *</Label>
                    <Input
                      id={`internalStorageSerialNumber-${index}`}
                      value={exhibit.internalStorageSerialNumber}
                      onChange={(e) => onChange(index, 'internalStorageSerialNumber', e.target.value)}
                      placeholder="Storage device serial number"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`internalStorageCapacity-${index}`}>Storage Capacity *</Label>
                    <Input
                      id={`internalStorageCapacity-${index}`}
                      value={exhibit.internalStorageCapacity}
                      onChange={(e) => onChange(index, 'internalStorageCapacity', e.target.value)}
                      placeholder="e.g., 500GB, 1TB"
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Storage Media Specific Fields */}
          {isStorageMedia && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`brand-${index}`}>Brand *</Label>
                  <Input
                    id={`brand-${index}`}
                    value={exhibit.brand}
                    onChange={(e) => onChange(index, 'brand', e.target.value)}
                    placeholder="e.g., SanDisk, Kingston"
                    required
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

              <div className="space-y-2">
                <Label htmlFor={`serialNumber-${index}`}>Serial Number *</Label>
                <Input
                  id={`serialNumber-${index}`}
                  value={exhibit.serialNumber}
                  onChange={(e) => onChange(index, 'serialNumber', e.target.value)}
                  placeholder="Device serial number"
                  required
                />
              </div>
            </>
          )}

          {/* Network Device Specific Fields */}
          {isNetworkDevice && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`brand-${index}`}>Brand *</Label>
                  <Input
                    id={`brand-${index}`}
                    value={exhibit.brand}
                    onChange={(e) => onChange(index, 'brand', e.target.value)}
                    placeholder="e.g., Cisco, TP-Link"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`macAddress-${index}`}>MAC Address *</Label>
                  <Input
                    id={`macAddress-${index}`}
                    value={exhibit.macAddress}
                    onChange={(e) => onChange(index, 'macAddress', e.target.value)}
                    placeholder="Network MAC address"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`model-${index}`}>Model</Label>
                  <Input
                    id={`model-${index}`}
                    value={exhibit.model}
                    onChange={(e) => onChange(index, 'model', e.target.value)}
                    placeholder="Model number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`serialNumber-${index}`}>Serial Number</Label>
                  <Input
                    id={`serialNumber-${index}`}
                    value={exhibit.serialNumber}
                    onChange={(e) => onChange(index, 'serialNumber', e.target.value)}
                    placeholder="Device serial number"
                  />
                </div>
              </div>
            </>
          )}

          {/* Other Device Type - Basic Fields */}
          {exhibit.exhibitType === 'other' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`brand-${index}`}>Brand</Label>
                <Input
                  id={`brand-${index}`}
                  value={exhibit.brand}
                  onChange={(e) => onChange(index, 'brand', e.target.value)}
                  placeholder="Device brand"
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
          )}

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

        </>
      )}
    </div>
  );
};
