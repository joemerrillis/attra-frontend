import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Lock } from 'lucide-react';
import { useQuickResponse } from '@/hooks/useQuickResponse';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { TemplateSelector } from './TemplateSelector';
import { UpgradePrompt } from '@/components/feature-gating/UpgradePrompt';

interface QuickResponseButtonProps {
  contactId: string;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export function QuickResponseButton({
  contactId,
  variant = 'default',
  size = 'default',
}: QuickResponseButtonProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { hasAccess, isLoading: checkingAccess } = useFeatureGate('contact_responses');
  const { openGmailCompose, isTracking } = useQuickResponse(contactId);

  // Mock templates - in production, fetch from API
  const templates = [
    {
      id: '1',
      name: 'Quick Follow-Up',
      subject: 'Thanks for your interest!',
      preview: 'Hi {{name}}, I saw you checked out our flyer at {{location}}...',
    },
    {
      id: '2',
      name: 'Introduction',
      subject: "Let's connect",
      preview: "Hi {{name}}, I'd love to tell you more about our services...",
    },
  ];

  const handleClick = () => {
    if (!hasAccess) {
      setShowUpgrade(true);
      return;
    }

    setShowTemplates(true);
  };

  const handleTemplateSelect = (templateId?: string) => {
    openGmailCompose(templateId);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={checkingAccess || isTracking}
      >
        {hasAccess ? (
          <>
            <Mail className="w-4 h-4 mr-2" />
            {isTracking ? 'Opening Gmail...' : 'Respond'}
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Unlock to Respond
          </>
        )}
      </Button>

      <TemplateSelector
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleTemplateSelect}
        templates={templates}
      />

      {showUpgrade && (
        <UpgradePrompt
          feature="contact_responses"
          featureName="Gmail Quick Response"
          featureDescription="Respond to leads instantly with pre-made templates"
          requiredPlan="Pro"
          upgradeUrl="/upgrade?feature=contact_responses"
        />
      )}
    </>
  );
}
