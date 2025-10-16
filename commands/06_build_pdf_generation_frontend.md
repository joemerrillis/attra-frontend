# Build PDF Generation Frontend

## Objective
Create frontend components for previewing and downloading print-ready flyer PDFs. Users should see their branded flyer before generating, download individual or batch PDFs, and have confidence that what they see is what prints.

## Dependencies
- ✅ Backend PDF generation service (from backend build)
- ✅ `04_build_campaign_wizard.md` (integrates into final step)
- ✅ Supabase Storage for PDF hosting

## Philosophy
**"What you see is what you print."**
- Preview shows exact flyer layout
- Download button → instant PDF
- Batch download for multiple locations
- Print-ready (CMYK, 8.5x11, bleed)

---

## Tech Stack
- **React + TypeScript**
- **PDF.js** or **react-pdf** for preview
- **React Query** for API calls
- **JSZip** for batch downloads

---

## File Structure

```
src/
├── components/
│   └── pdf/
│       ├── PDFPreview.tsx
│       ├── PDFGenerator.tsx
│       ├── DownloadButton.tsx
│       └── BatchDownload.tsx
├── hooks/
│   └── usePDFGeneration.ts
└── lib/
    └── pdf-utils.ts
```

---

## API Contract

### Generate PDF Endpoint

**Request:**
```typescript
POST /api/campaigns/{campaignId}/generate-assets
{
  "location_ids": ["uuid1", "uuid2"]
}
```

**Response:**
```typescript
{
  "assets": [
    {
      "id": "uuid",
      "campaign_id": "uuid",
      "location_id": "uuid",
      "file_url": "https://storage.supabase.co/.../flyer.pdf",
      "qr_link_id": "uuid",
      "created_at": "2025-10-15T10:30:00Z"
    }
  ]
}
```

---

## Implementation

### 1. PDF Generation Hook

**File:** `src/hooks/usePDFGeneration.ts`

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const usePDFGeneration = () => {
  const generatePDFs = useMutation({
    mutationFn: async ({ 
      campaignId, 
      locationIds 
    }: { 
      campaignId: string; 
      locationIds: string[] 
    }) => {
      const response = await api.post(
        `/api/campaigns/${campaignId}/generate-assets`,
        { location_ids: locationIds }
      );
      return response.data;
    }
  });

  const getAssets = useQuery({
    queryKey: ['assets'],
    queryFn: async ({ campaignId }: { campaignId: string }) => {
      const response = await api.get(`/api/campaigns/${campaignId}/assets`);
      return response.data.assets;
    }
  });

  return {
    generatePDFs: generatePDFs.mutate,
    isGenerating: generatePDFs.isPending,
    assets: getAssets.data || [],
    error: generatePDFs.error
  };
};
```

---

### 2. PDF Preview Component

**File:** `src/components/pdf/PDFPreview.tsx`

```typescript
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  fileUrl?: string;
  placeholderData?: {
    headline: string;
    subheadline: string;
    logoUrl?: string;
    primaryColor: string;
  };
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  fileUrl,
  placeholderData
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  // If no PDF yet, show placeholder preview
  if (!fileUrl && placeholderData) {
    return (
      <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
        <div className="aspect-[8.5/11] p-8 flex flex-col items-center justify-center text-center">
          {placeholderData.logoUrl && (
            <img
              src={placeholderData.logoUrl}
              alt="Logo"
              className="h-16 mb-6"
            />
          )}
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ color: placeholderData.primaryColor }}
          >
            {placeholderData.headline}
          </h1>
          <p className="text-lg text-gray-700 max-w-md">
            {placeholderData.subheadline}
          </p>
          <div className="mt-8 w-32 h-32 border-4 border-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">QR Code</span>
          </div>
        </div>
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-600">
          Preview - Generate to see final PDF
        </div>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <p className="text-gray-500">No preview available</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
      {/* Controls */}
      <div className="bg-gray-100 p-3 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium px-2">
            {Math.round(scale * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
            disabled={scale >= 2.0}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        
        {numPages > 1 && (
          <div className="text-sm text-gray-600">
            Page {pageNumber} of {numPages}
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="overflow-auto max-h-[600px] flex justify-center bg-gray-50 p-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
        
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<Loader2 className="w-8 h-8 animate-spin text-blue-600" />}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
};
```

---

### 3. Download Button Component

**File:** `src/components/pdf/DownloadButton.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Check } from 'lucide-react';

interface DownloadButtonProps {
  fileUrl: string;
  filename: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline';
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  fileUrl,
  filename,
  size = 'default',
  variant = 'default'
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Fetch the file
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading || downloaded}
      size={size}
      variant={variant}
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Downloading...
        </>
      ) : downloaded ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Downloaded
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </>
      )}
    </Button>
  );
};
```

---

### 4. Batch Download Component

**File:** `src/components/pdf/BatchDownload.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Asset {
  id: string;
  file_url: string;
  location?: {
    name: string;
  };
}

interface BatchDownloadProps {
  assets: Asset[];
  campaignName: string;
}

export const BatchDownload: React.FC<BatchDownloadProps> = ({
  assets,
  campaignName
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBatchDownload = async () => {
    setIsDownloading(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder(campaignName);

      // Download all PDFs
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        try {
          const response = await fetch(asset.file_url);
          const blob = await response.blob();
          
          const filename = asset.location
            ? `${asset.location.name.replace(/[^a-z0-9]/gi, '_')}.pdf`
            : `flyer-${i + 1}.pdf`;
          
          folder?.file(filename, blob);
          
          setProgress(((i + 1) / assets.length) * 100);
        } catch (error) {
          console.error(`Failed to download ${asset.file_url}:`, error);
        }
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${campaignName.replace(/[^a-z0-9]/gi, '_')}.zip`);
      
    } catch (error) {
      console.error('Batch download failed:', error);
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleBatchDownload}
        disabled={isDownloading}
        variant="outline"
        className="w-full"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Downloading {Math.round(progress)}%
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download All ({assets.length} PDFs)
          </>
        )}
      </Button>
      
      {isDownloading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
```

---

### 5. PDF Generator Container

**File:** `src/components/pdf/PDFGenerator.tsx`

```typescript
import React, { useEffect } from 'react';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { PDFPreview } from './PDFPreview';
import { DownloadButton } from './DownloadButton';
import { BatchDownload } from './BatchDownload';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';

interface PDFGeneratorProps {
  campaignId: string;
  locationIds: string[];
  campaignData: {
    name: string;
    headline: string;
    subheadline: string;
    tenant: {
      logo_url?: string;
      primary_color: string;
    };
  };
  autoGenerate?: boolean;
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({
  campaignId,
  locationIds,
  campaignData,
  autoGenerate = false
}) => {
  const { generatePDFs, isGenerating, assets } = usePDFGeneration();

  useEffect(() => {
    if (autoGenerate && locationIds.length > 0 && assets.length === 0) {
      handleGenerate();
    }
  }, [autoGenerate, locationIds]);

  const handleGenerate = () => {
    generatePDFs({ campaignId, locationIds });
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-12 border-2 border-dashed rounded-lg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-1">
            Generating your flyers...
          </p>
          <p className="text-sm text-gray-500">
            Creating {locationIds.length} PDF{locationIds.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="space-y-6">
        <PDFPreview
          placeholderData={{
            headline: campaignData.headline,
            subheadline: campaignData.subheadline,
            logoUrl: campaignData.tenant.logo_url,
            primaryColor: campaignData.tenant.primary_color
          }}
        />
        
        <Button
          onClick={handleGenerate}
          size="lg"
          className="w-full"
        >
          <FileText className="w-5 h-5 mr-2" />
          Generate {locationIds.length} Flyer{locationIds.length !== 1 ? 's' : ''}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview first PDF */}
      <PDFPreview fileUrl={assets[0]?.file_url} />

      {/* Download options */}
      <div className="space-y-3">
        {assets.length === 1 ? (
          <DownloadButton
            fileUrl={assets[0].file_url}
            filename={`${campaignData.name}.pdf`}
            size="lg"
          />
        ) : (
          <>
            <BatchDownload
              assets={assets}
              campaignName={campaignData.name}
            />
            
            <div className="grid grid-cols-2 gap-2">
              {assets.map((asset, idx) => (
                <DownloadButton
                  key={asset.id}
                  fileUrl={asset.file_url}
                  filename={asset.location?.name 
                    ? `${asset.location.name}.pdf` 
                    : `flyer-${idx + 1}.pdf`}
                  size="sm"
                  variant="outline"
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Regenerate option */}
      <Button
        onClick={handleGenerate}
        variant="outline"
        className="w-full"
      >
        Regenerate PDFs
      </Button>
    </div>
  );
};
```

---

## Package Installation

```bash
npm install react-pdf pdfjs-dist jszip file-saver
npm install --save-dev @types/file-saver
```

---

## Usage in Campaign Wizard

```typescript
// In CampaignWizard Step 5 (Review & Generate)
import { PDFGenerator } from '@/components/pdf/PDFGenerator';

const CampaignWizardStep5 = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Review & Generate
      </h2>

      <PDFGenerator
        campaignId={campaign.id}
        locationIds={selectedLocationIds}
        campaignData={{
          name: campaign.name,
          headline: campaign.headline,
          subheadline: campaign.subheadline,
          tenant: tenant
        }}
        autoGenerate={false}
      />
    </div>
  );
};
```

---

## Testing

### Manual Tests

1. **Preview:**
   - Load campaign with data
   - Verify placeholder preview shows
   - Verify headline, subheadline, logo appear

2. **Generation:**
   - Click "Generate" button
   - Wait for loading state
   - Verify PDF preview loads
   - Verify zoom controls work

3. **Single download:**
   - Click download button
   - Verify PDF downloads
   - Open PDF in viewer
   - Verify print quality

4. **Batch download:**
   - Generate PDFs for 3 locations
   - Click "Download All"
   - Verify ZIP downloads
   - Extract and verify all PDFs present

5. **Regeneration:**
   - Click "Regenerate PDFs"
   - Verify new PDFs generated
   - Verify old PDFs replaced

---

## Print Quality Checklist

- [ ] 8.5 x 11 inches
- [ ] 300 DPI resolution
- [ ] CMYK color space (not RGB)
- [ ] 0.125" bleed on all sides
- [ ] Fonts embedded
- [ ] Images high resolution
- [ ] QR code scannable at print size

---

## Acceptance Criteria

- [ ] PDF preview component renders
- [ ] Placeholder preview shows before generation
- [ ] Generate button triggers API call
- [ ] Loading state shows during generation
- [ ] PDF preview loads after generation
- [ ] Zoom controls work
- [ ] Download button downloads PDF
- [ ] Downloaded PDF opens correctly
- [ ] Batch download creates ZIP
- [ ] ZIP contains all PDFs
- [ ] Regenerate button works
- [ ] Print quality verified
- [ ] Mobile responsive

---

## Estimated Build Time

**5 hours**

## Priority

**Critical** - Users need to download and print flyers
