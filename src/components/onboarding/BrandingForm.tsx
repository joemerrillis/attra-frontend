import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

interface BrandingFormProps {
  tenantName: string;
  onTenantNameChange: (name: string) => void;
  logoFile: File | null;
  onLogoChange: (file: File | null) => void;
  primaryColor: string;
  onColorChange: (color: string) => void;
}

export const BrandingForm: React.FC<BrandingFormProps> = ({
  tenantName,
  onTenantNameChange,
  onLogoChange,
  primaryColor,
  onColorChange,
}) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLogoChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Add Your Branding</h2>
      <p className="text-gray-600 mb-6">
        This will appear on all your flyers and scan pages
      </p>

      <div className="space-y-6">
        {/* Business name */}
        <div>
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={tenantName}
            onChange={(e) => onTenantNameChange(e.target.value)}
            placeholder="Acme Dog Walking"
            className="mt-1"
          />
        </div>

        {/* Logo upload */}
        <div>
          <Label>Logo (Optional)</Label>
          <div className="mt-1">
            <label
              htmlFor="logo-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="max-h-28 object-contain"
                />
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload logo
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Primary color */}
        <div>
          <Label htmlFor="primaryColor">Primary Color *</Label>
          <div className="flex items-center gap-3 mt-1">
            <input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => onColorChange(e.target.value)}
              placeholder="#3B82F6"
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
