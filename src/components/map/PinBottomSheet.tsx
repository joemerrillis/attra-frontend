import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Sparkles } from 'lucide-react';
import type { MapLocation } from '@/hooks/useMapSummary';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useNavigate } from 'react-router-dom';

export interface PinBottomSheetProps {
  /** Location data */
  location: MapLocation | null;
  /** Whether sheet is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Whether user has access to view contact details */
  hasAccess?: boolean;
}

export function PinBottomSheet({
  location,
  open,
  onClose,
  hasAccess = true, // Default to true for backwards compatibility
}: PinBottomSheetProps) {
  const navigate = useNavigate();

  // Check if user has access to Gmail deep link feature (Pro tier)
  const { data: gmailAccess } = useFeatureAccess('gmail_deep_link');
  const canUseGmail = gmailAccess?.hasAccess ?? false;

  if (!location) return null;

  const handleEmailContact = (email: string, name: string) => {
    if (!canUseGmail) {
      // Show upgrade prompt (handled by button redirect)
      return;
    }

    // Open Gmail compose window with pre-filled recipient
    const subject = encodeURIComponent(`Following up from ${location.location_name}`);
    const body = encodeURIComponent(`Hi ${name.split(' ')[0]},\n\nThanks for your interest at ${location.location_name}!\n\n`);
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`,
      '_blank'
    );
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">
            {location.location_name}
          </SheetTitle>
          <SheetDescription>
            ●{'>'}  {location.contacts_pending} contact{location.contacts_pending !== 1 ? 's' : ''} ready to follow up
          </SheetDescription>
        </SheetHeader>

        {/* Locked State - Show stats + upgrade prompt */}
        {!hasAccess && location.contacts_pending > 0 && (
          <div className="mb-6">
            {/* Stats Overview (always visible) */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold">{location.scans_today || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Scans Today</div>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 text-center">
                <div className="text-3xl font-bold text-accent">
                  {location.contacts_pending}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Contacts Pending</div>
              </div>
            </div>

            {/* Upgrade Prompt */}
            <div className="p-6 rounded-lg border-2 border-dashed border-primary/25 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {location.contacts_pending} Contact{location.contacts_pending !== 1 ? 's' : ''} Ready to Follow Up
                  </h3>

                  <p className="text-sm text-muted-foreground mb-4">
                    Unlock full contact details including names, emails, and scan timestamps to start converting these leads.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => navigate('/upgrade?feature=contact_details')}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Unlock Contacts
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => navigate('/upgrade')}
                    >
                      View Plans
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Access - Show contact list */}
        {hasAccess && (
          <div
            className="space-y-3 overflow-y-auto max-h-[calc(85vh-120px)]"
            role="list"
            aria-label={`Contacts at ${location.location_name}`}
          >
            {location.contacts.length === 0 && (
              <div
                className="text-center py-8 text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <p>No contacts at this location yet.</p>
                <p className="text-sm mt-2">Contacts will appear here as people scan your QR codes.</p>
              </div>
            )}

            {location.contacts.map((contact) => (
            <div
              key={contact.id}
              className={cn(
                'p-4',
                'border rounded-lg',
                'bg-card',
                'space-y-3',
              )}
              role="listitem"
              aria-label={`Contact: ${contact.name}`}
            >
              {/* Contact info */}
              <div>
                <div className="font-medium">{contact.name}</div>
                <div className="text-sm text-muted-foreground">{contact.email}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Scanned {new Date(contact.scanned_at).toLocaleDateString()} at {new Date(contact.scanned_at).toLocaleTimeString()}
                </div>
              </div>

              {/* Action button with feature gate */}
              {canUseGmail ? (
                <Button
                  variant="accent"
                  size="sm"
                  className="w-full"
                  onClick={() => handleEmailContact(contact.email, contact.name)}
                  aria-label={`Open Gmail to email ${contact.name}`}
                >
                  <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                  Open in Gmail
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full relative"
                  onClick={() => {
                    // Redirect to upgrade page
                    window.location.href = '/upgrade?feature=gmail_deep_link';
                  }}
                  aria-label="Upgrade to Pro to email contacts"
                >
                  <Lock className="w-4 h-4 mr-2" aria-hidden="true" />
                  Upgrade to Pro to Email
                </Button>
              )}
            </div>
          ))}

            {/* Clear all badges button (Pro tier only) - shown only for users with full access */}
            {location.contacts_pending > 0 && (
              <div
                className="pt-4 border-t mt-4"
                role="region"
                aria-label="Batch actions"
              >
                {canUseGmail ? (
                  <Button
                    variant="accent"
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => {
                      // TODO: Implement batch email
                      console.log('Clear all badges for', location.location_id);
                    }}
                    aria-label={`Email all ${location.contacts_pending} contacts and clear badges`}
                  >
                    <Mail className="w-5 h-5" />
                    {'>'}● Email All & Clear Badges
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      window.location.href = '/upgrade?feature=gmail_deep_link';
                    }}
                    aria-label="Upgrade to Pro to email all contacts"
                  >
                    <Lock className="w-4 h-4 mr-2" aria-hidden="true" />
                    Upgrade to Pro to Email All
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* No contacts state - shown regardless of access */}
        {location.contacts_pending === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending contacts at this location</p>
            <p className="text-sm mt-2">New scans will appear here in real-time</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
