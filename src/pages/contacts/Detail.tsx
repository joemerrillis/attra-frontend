import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Plus,
  Edit,
  Trash,
} from 'lucide-react';
import { useContactDetail } from '@/hooks/useContactDetail';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { formatContactForDisplay } from '@/lib/data-masking';
import { DataMasking } from '@/components/contacts/DataMasking';
import { AttributionTimeline } from '@/components/contacts/AttributionTimeline';
import { QuickResponseButton } from '@/components/contacts/QuickResponseButton';
import { LogInteractionForm } from '@/components/contacts/LogInteractionForm';
import { format } from 'date-fns';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showLogForm, setShowLogForm] = useState(false);

  const { contact, timeline, isLoading } = useContactDetail(id!);
  const { hasAccess } = useFeatureGate('contact_details');

  if (isLoading) {
    return <div className="container py-8">Loading contact...</div>;
  }

  if (!contact) {
    return <div className="container py-8">Contact not found</div>;
  }

  const display = formatContactForDisplay(contact, hasAccess);

  return (
    <div className="container py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/contacts')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{contact.name}</h1>
            <p className="text-muted-foreground">
              Captured {format(new Date(contact.created_at), 'PPP')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <DataMasking
                  value={display.email}
                  masked={display.masked}
                />
              </div>

              {/* Phone */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </div>
                <DataMasking
                  value={display.phone}
                  masked={display.masked}
                />
              </div>

              <Separator />

              {/* Location */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
                <p className="font-medium">{contact.location?.name || '—'}</p>
                {contact.location?.address && (
                  <p className="text-sm text-muted-foreground">
                    {contact.location.address}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Contact Type
                </div>
                <Badge variant="outline">
                  {contact.contact_kind || 'lead'}
                </Badge>
              </div>

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickResponseButton
                contactId={contact.id}
                variant="default"
                size="default"
              />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowLogForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Interaction
              </Button>

              <Button variant="outline" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Follow-Up
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2">
          <AttributionTimeline timeline={timeline} />
        </div>
      </div>

      {/* Log Interaction Modal */}
      <LogInteractionForm
        contactId={contact.id}
        open={showLogForm}
        onClose={() => setShowLogForm(false)}
      />
    </div>
  );
}