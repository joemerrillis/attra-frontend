import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Mail, Sparkles } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  subject: string;
  preview: string;
}

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId?: string) => void;
  templates: Template[];
}

export function TemplateSelector({
  open,
  onClose,
  onSelect,
  templates,
}: TemplateSelectorProps) {
  const [selected, setSelected] = useState<string | undefined>();

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Email Template</DialogTitle>
          <DialogDescription>
            Pick a template to pre-fill your email. You can edit it in Gmail before sending.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={selected} onValueChange={setSelected}>
          <div className="space-y-3">
            {/* Blank option */}
            <Label
              htmlFor="blank"
              className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors"
            >
              <RadioGroupItem value="blank" id="blank" className="mt-1" />
              <div className="ml-3 flex-1">
                <div className="font-semibold">Blank Email</div>
                <p className="text-sm text-muted-foreground">
                  Start with a fresh email (no template)
                </p>
              </div>
              <Mail className="w-5 h-5 text-muted-foreground" />
            </Label>

            {/* Templates */}
            {templates.map((template) => (
              <Label
                key={template.id}
                htmlFor={template.id}
                className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                <div className="ml-3 flex-1">
                  <div className="font-semibold">{template.name}</div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Subject: {template.subject}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.preview}
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-purple-500" />
              </Label>
            ))}
          </div>
        </RadioGroup>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <Mail className="w-4 h-4 mr-2" />
            Open Gmail
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
