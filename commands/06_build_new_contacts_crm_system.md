# 06_build_contacts_crm_system.md

## 🎯 Goal

Build a complete contacts & attribution system that shows how physical flyers convert into digital leads. This is the **CRM layer** of Attra - but focused on **attribution, not relationship management**. Users see who scanned their flyers, can respond quickly via Gmail, and track follow-up actions while maintaining FOMO-driven upgrade incentives through strategic data masking.

**Timeline:** 10-12 hours  
**Priority:** CRITICAL - Core product value

---

## 📋 Prerequisites

- ✅ `00_build_pull_contracts.md` executed (schema contracts available)
- ✅ `05_build_scan_capture_system.md` completed (contacts being created)
- ✅ `08_build_feature_gating_system.md` completed (plan limits working)
- ✅ Backend has contacts, interactions, and Gmail quick response endpoints
- ✅ Feature gating tables configured in database

---

## 🧭 User Journey

This file builds the complete flow:

1. **Contact appears** → User sees new contact in dashboard (from QR scan)
2. **Data teaser** → Free tier sees name only, email/phone masked
3. **Upgrade prompt** → Click "Reach Out" shows paywall on free tier
4. **Attribution timeline** → See scan → respond sequence with timestamps
5. **Quick response** → Click "Respond", select template, Gmail opens
6. **Manual logging** → Log calls/meetings to track follow-up
7. **Follow-up reminders** → See contacts needing attention

**Result:** Attribution-focused contact management that drives upgrades naturally.

---

## 🗂️ Complete File Structure

```
src/
├── pages/
│   └── contacts/
│       ├── Index.tsx                    (Contacts list page)
│       ├── [id]/Detail.tsx              (Contact detail + timeline)
│       └── FollowUps.tsx                (Upcoming follow-ups view)
├── components/
│   └── contacts/
│       ├── ContactsTable.tsx            (Main table with masking)
│       ├── ContactCard.tsx              (Card view for mobile)
│       ├── ContactHeader.tsx            (Detail page header)
│       ├── AttributionTimeline.tsx      (Event timeline)
│       ├── TimelineEvent.tsx            (Individual event item)
│       ├── QuickResponseButton.tsx      (Gmail compose trigger)
│       ├── TemplateSelector.tsx         (Pick email template)
│       ├── LogInteractionForm.tsx       (Log call/meeting)
│       ├── FollowUpCard.tsx             (Follow-up reminder)
│       ├── DataMasking.tsx              (Masked field display)
│       └── UpgradePrompt.tsx            (Feature gate modal)
├── hooks/
│   ├── useContacts.ts                   (Contact CRUD operations)
│   ├── useContactDetail.ts              (Single contact with timeline)
│   ├── useInteractions.ts               (Interaction logging)
│   ├── useQuickResponse.ts              (Gmail compose URL generation)
│   └── useFollowUps.ts                  (Follow-up queries)
└── lib/
    ├── contact-utils.ts                 (Contact helper functions)
    ├── data-masking.ts                  (Masking logic)
    └── timeline-utils.ts                (Timeline event formatting)
```

---

## 📊 Backend Contracts (Already Built)

### Contacts Endpoint
```typescript
GET /api/internal/contacts
Response: {
  id: string;
  tenant_id: string;
  location_id: string;
  name: string;
  email: string;
  phone: string;
  contact_kind: 'lead' | 'client' | 'partner';
  tags: string[];
  created_at: string;
  location: { name: string };
  interactions: { count: number };
}[]
```

### Contact Detail Endpoint
```typescript
GET /api/internal/contacts/:id
Response: {
  ...contact,
  location: Location;
  interactions: Interaction[];
  qr_scans: QRScan[];
  contact_responses: ContactResponse[];
}
```

### Interactions Endpoint
```typescript
POST /api/internal/interactions
Body: {
  tenant_id: string;
  contact_id: string;
  interaction_type: 'phone_call' | 'meeting' | 'email' | 'door_knock';
  notes: string;
  outcome: 'interested' | 'not_home' | 'rejected' | 'follow_up_scheduled';
  follow_up_date?: string;
}
```

### Gmail Quick Response
```typescript
GET /api/internal/gmail/quick-response/:contactId/compose-url?templateId=xxx
Response: {
  composeUrl: string;
  template: EmailTemplate;
  preview: {
    subject: string;
    body: string;
  };
}

POST /api/internal/gmail/quick-response/:contactId/track-opened
Body: {
  template_id?: string;
}
Response: {
  success: boolean;
  response_time_seconds: number;
}
```

### Feature Gating
```typescript
GET /api/internal/feature-gates/check?feature=contact_details
Response: {
  hasAccess: boolean;
  planKey: string;
  requiredPlan: string;
  upgradeUrl: string;
}
```

---

## 🎨 Implementation

### Step 1: Data Masking Utilities

**File:** `src/lib/data-masking.ts`

```typescript
import { useFeatureGate } from '@/hooks/useFeatureGate';

interface MaskOptions {
  maskChar?: string;
  showFirst?: number;
  showLast?: number;
}

/**
 * Mask sensitive data based on plan access
 */
export function maskData(
  value: string | null | undefined,
  options: MaskOptions = {}
): string {
  if (!value) return '—';
  
  const { maskChar = '•', showFirst = 0, showLast = 0 } = options;
  
  if (showFirst + showLast >= value.length) {
    return value.split('').map(() => maskChar).join('');
  }
  
  const start = value.slice(0, showFirst);
  const end = value.slice(-showLast);
  const middle = maskChar.repeat(Math.max(6, value.length - showFirst - showLast));
  
  return `${start}${middle}${end}`;
}

/**
 * Mask email address
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '—';
  
  const [local, domain] = email.split('@');
  if (!domain) return maskData(email);
  
  const maskedLocal = maskData(local, { showFirst: 1, showLast: 0 });
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  
  // Remove formatting, keep only digits
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${digits.slice(0, 3)}) •••-••••`;
  }
  
  return maskData(phone, { showFirst: 3, showLast: 0 });
}

/**
 * Format contact for display with masking
 */
export function formatContactForDisplay(
  contact: any,
  hasAccess: boolean
) {
  if (hasAccess) {
    return {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      masked: false,
    };
  }
  
  return {
    name: contact.name, // Name always visible
    email: maskEmail(contact.email),
    phone: maskPhone(contact.phone),
    masked: true,
  };
}
```

---

### Step 2: Timeline Utilities

**File:** `src/lib/timeline-utils.ts`

```typescript
import { format, formatDistanceToNow } from 'date-fns';

export type TimelineEventType = 
  | 'scan'
  | 'contact_created'
  | 'email_sent'
  | 'email_received'
  | 'phone_call'
  | 'meeting'
  | 'follow_up_scheduled';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  icon: string;
  color: string;
}

/**
 * Convert backend data into unified timeline events
 */
export function buildTimeline(contactDetail: any): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  // Contact created (from first scan)
  if (contactDetail.created_at) {
    events.push({
      id: `created-${contactDetail.id}`,
      type: 'contact_created',
      timestamp: contactDetail.created_at,
      title: 'Contact captured',
      description: `Scanned flyer at ${contactDetail.location?.name || 'unknown location'}`,
      icon: 'UserPlus',
      color: 'text-green-600',
    });
  }
  
  // QR Scans
  contactDetail.qr_scans?.forEach((scan: any) => {
    events.push({
      id: `scan-${scan.id}`,
      type: 'scan',
      timestamp: scan.scanned_at,
      title: 'Scanned QR code',
      description: `Location: ${scan.location?.name || 'Unknown'}`,
      metadata: {
        campaign: scan.campaign_name,
        device: scan.device_type,
      },
      icon: 'QrCode',
      color: 'text-blue-600',
    });
  });
  
  // Contact Responses (Gmail opens)
  contactDetail.contact_responses?.forEach((response: any) => {
    const hours = Math.floor(response.response_time_seconds / 3600);
    const minutes = Math.floor((response.response_time_seconds % 3600) / 60);
    
    events.push({
      id: `response-${response.id}`,
      type: 'email_sent',
      timestamp: response.opened_at,
      title: 'You reached out',
      description: `Responded ${hours}h ${minutes}m after scan`,
      metadata: {
        template: response.template?.name,
        responseTime: response.response_time_seconds,
      },
      icon: 'Mail',
      color: 'text-purple-600',
    });
  });
  
  // Manual Interactions
  contactDetail.interactions?.forEach((interaction: any) => {
    const typeConfig = {
      phone_call: { icon: 'Phone', color: 'text-orange-600', title: 'Phone call' },
      meeting: { icon: 'Calendar', color: 'text-indigo-600', title: 'Meeting' },
      email: { icon: 'Mail', color: 'text-purple-600', title: 'Email' },
      door_knock: { icon: 'Home', color: 'text-teal-600', title: 'Door knock' },
    };
    
    const config = typeConfig[interaction.interaction_type as keyof typeof typeConfig] || {
      icon: 'MessageCircle',
      color: 'text-gray-600',
      title: 'Interaction',
    };
    
    events.push({
      id: `interaction-${interaction.id}`,
      type: interaction.interaction_type,
      timestamp: interaction.created_at,
      title: config.title,
      description: interaction.notes,
      metadata: {
        outcome: interaction.outcome,
        followUpDate: interaction.follow_up_date,
      },
      icon: config.icon,
      color: config.color,
    });
  });
  
  // Sort by timestamp (most recent first)
  return events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Format relative time with exact timestamp on hover
 */
export function formatEventTime(timestamp: string): {
  relative: string;
  exact: string;
} {
  return {
    relative: formatDistanceToNow(new Date(timestamp), { addSuffix: true }),
    exact: format(new Date(timestamp), 'PPpp'),
  };
}

/**
 * Calculate response time metrics
 */
export function calculateResponseMetrics(timeline: TimelineEvent[]) {
  const scanEvent = timeline.find(e => e.type === 'scan' || e.type === 'contact_created');
  const responseEvent = timeline.find(e => e.type === 'email_sent');
  
  if (!scanEvent || !responseEvent) {
    return null;
  }
  
  const scanTime = new Date(scanEvent.timestamp).getTime();
  const responseTime = new Date(responseEvent.timestamp).getTime();
  const diffSeconds = Math.floor((responseTime - scanTime) / 1000);
  
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  
  return {
    seconds: diffSeconds,
    formatted: `${hours}h ${minutes}m`,
    isFast: diffSeconds < 7200, // Less than 2 hours
  };
}
```

---

### Step 3: Hooks for Contacts

**File:** `src/hooks/useContacts.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ContactFilters {
  contact_kind?: string;
  location_id?: string;
  tags?: string[];
  search?: string;
}

export function useContacts(filters: ContactFilters = {}) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['contacts', filters],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const response = await fetch(
        `/api/internal/contacts?${new URLSearchParams(filters as any)}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });
  
  const createContact = useMutation({
    mutationFn: async (contactData: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/internal/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });
      
      if (!response.ok) throw new Error('Failed to create contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
  
  const updateContact = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/internal/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
  
  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/internal/contacts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
  
  return {
    contacts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createContact,
    updateContact,
    deleteContact,
  };
}
```

**File:** `src/hooks/useContactDetail.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buildTimeline } from '@/lib/timeline-utils';

export function useContactDetail(contactId: string) {
  const query = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const response = await fetch(`/api/internal/contacts/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch contact');
      return response.json();
    },
    enabled: !!contactId,
  });
  
  const timeline = query.data ? buildTimeline(query.data) : [];
  
  return {
    contact: query.data,
    timeline,
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

**File:** `src/hooks/useQuickResponse.ts`

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useQuickResponse(contactId: string) {
  const { toast } = useToast();
  
  const getComposeUrl = async (templateId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    
    const url = `/api/internal/gmail/quick-response/${contactId}/compose-url${
      templateId ? `?templateId=${templateId}` : ''
    }`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    
    return response.json();
  };
  
  const trackResponse = useMutation({
    mutationFn: async (templateId?: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `/api/internal/gmail/quick-response/${contactId}/track-opened`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ template_id: templateId }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to track response');
      return response.json();
    },
  });
  
  const openGmailCompose = async (templateId?: string) => {
    try {
      // Get compose URL
      const { composeUrl, preview } = await getComposeUrl(templateId);
      
      // Track that user clicked "Respond"
      await trackResponse.mutateAsync(templateId);
      
      // Open Gmail in new tab
      window.open(composeUrl, '_blank');
      
      toast({
        title: 'Gmail opened',
        description: `Template loaded. Response time: ${preview.responseTime || 'calculating'}`,
      });
    } catch (error: any) {
      if (error.error === 'Response limit reached') {
        toast({
          title: 'Upgrade required',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to open Gmail',
          description: 'Please try again',
          variant: 'destructive',
        });
      }
    }
  };
  
  return {
    openGmailCompose,
    isTracking: trackResponse.isPending,
  };
}
```

**File:** `src/hooks/useInteractions.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface InteractionData {
  contact_id: string;
  interaction_type: 'phone_call' | 'meeting' | 'email' | 'door_knock';
  notes: string;
  outcome: 'interested' | 'not_home' | 'rejected' | 'follow_up_scheduled';
  follow_up_date?: string;
}

export function useInteractions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const logInteraction = useMutation({
    mutationFn: async (data: InteractionData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const response = await fetch('/api/internal/interactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to log interaction');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact', variables.contact_id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      toast({
        title: 'Interaction logged',
        description: 'Timeline updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to log interaction',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });
  
  return {
    logInteraction: logInteraction.mutate,
    isLogging: logInteraction.isPending,
  };
}
```

---

### Step 4: Data Masking Component

**File:** `src/components/contacts/DataMasking.tsx`

```typescript
import { Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DataMaskingProps {
  value: string;
  masked: boolean;
  label?: string;
}

export function DataMasking({ value, masked, label }: DataMaskingProps) {
  const navigate = useNavigate();
  
  if (!masked) {
    return <span className="font-medium">{value}</span>;
  }
  
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-gray-400 font-mono">{value}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/upgrade?feature=contact_details')}
        className="h-6 px-2 text-xs"
      >
        <Lock className="w-3 h-3 mr-1" />
        Unlock
      </Button>
    </div>
  );
}
```

---

### Step 5: Contacts Table

**File:** `src/components/contacts/ContactsTable.tsx`

```typescript
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '@/hooks/useContacts';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { formatContactForDisplay } from '@/lib/data-masking';
import { DataMasking } from './DataMasking';
import { format } from 'date-fns';

interface ContactsTableProps {
  filters?: any;
}

export function ContactsTable({ filters }: ContactsTableProps) {
  const navigate = useNavigate();
  const { contacts, isLoading } = useContacts(filters);
  const { hasAccess } = useFeatureGate('contact_details');
  
  const displayContacts = useMemo(() => {
    return contacts.map((contact: any) => ({
      ...contact,
      display: formatContactForDisplay(contact, hasAccess),
    }));
  }, [contacts, hasAccess]);
  
  if (isLoading) {
    return <div className="text-center py-8">Loading contacts...</div>;
  }
  
  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          No contacts yet. Share your flyers to start capturing leads!
        </p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Captured</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayContacts.map((contact: any) => (
            <TableRow
              key={contact.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/contacts/${contact.id}`)}
            >
              <TableCell className="font-medium">
                {contact.name}
              </TableCell>
              <TableCell>
                <DataMasking
                  value={contact.display.email}
                  masked={contact.display.masked}
                />
              </TableCell>
              <TableCell>
                <DataMasking
                  value={contact.display.phone}
                  masked={contact.display.masked}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {contact.location?.name || '—'}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {contact.contact_kind || 'lead'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(contact.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/contacts/${contact.id}`);
                  }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

### Step 6: Attribution Timeline

**File:** `src/components/contacts/TimelineEvent.tsx`

```typescript
import { memo } from 'react';
import * as Icons from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatEventTime } from '@/lib/timeline-utils';
import type { TimelineEvent as TimelineEventType } from '@/lib/timeline-utils';

interface TimelineEventProps {
  event: TimelineEventType;
  isFirst: boolean;
  isLast: boolean;
}

export const TimelineEvent = memo(({ event, isFirst, isLast }: TimelineEventProps) => {
  const Icon = (Icons as any)[event.icon] || Icons.Circle;
  const { relative, exact } = formatEventTime(event.timestamp);
  
  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
      )}
      
      {/* Icon */}
      <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background ${
        isFirst ? 'border-primary' : 'border-border'
      }`}>
        <Icon className={`w-5 h-5 ${event.color}`} />
      </div>
      
      {/* Content */}
      <Card className={`flex-1 ${isFirst ? 'border-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">{event.title}</h4>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
              )}
            </div>
            <time
              className="text-xs text-muted-foreground"
              title={exact}
            >
              {relative}
            </time>
          </div>
          
          {/* Metadata */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {event.metadata.campaign && (
                <Badge variant="secondary" className="text-xs">
                  {event.metadata.campaign}
                </Badge>
              )}
              {event.metadata.outcome && (
                <Badge variant="outline" className="text-xs">
                  {event.metadata.outcome}
                </Badge>
              )}
              {event.metadata.followUpDate && (
                <Badge variant="outline" className="text-xs">
                  Follow-up: {new Date(event.metadata.followUpDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

TimelineEvent.displayName = 'TimelineEvent';
```

**File:** `src/components/contacts/AttributionTimeline.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, TrendingUp } from 'lucide-react';
import { TimelineEvent } from './TimelineEvent';
import { calculateResponseMetrics } from '@/lib/timeline-utils';
import type { TimelineEvent as TimelineEventType } from '@/lib/timeline-utils';

interface AttributionTimelineProps {
  timeline: TimelineEventType[];
}

export function AttributionTimeline({ timeline }: AttributionTimelineProps) {
  const metrics = calculateResponseMetrics(timeline);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Attribution Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Response time metric */}
        {metrics && (
          <Alert className={`mb-6 ${metrics.isFast ? 'border-green-500 bg-green-50' : ''}`}>
            <TrendingUp className={`h-4 w-4 ${metrics.isFast ? 'text-green-600' : ''}`} />
            <AlertDescription>
              <strong>Response time: {metrics.formatted}</strong>
              {metrics.isFast && ' — Great job! Fast responses increase conversion.'}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Timeline events */}
        <div className="space-y-0">
          {timeline.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activity yet
            </p>
          ) : (
            timeline.map((event, index) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isFirst={index === 0}
                isLast={index === timeline.length - 1}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Step 7: Quick Response Components

**File:** `src/components/contacts/TemplateSelector.tsx`

```typescript
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
```

**File:** `src/components/contacts/QuickResponseButton.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Lock } from 'lucide-react';
import { useQuickResponse } from '@/hooks/useQuickResponse';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { TemplateSelector } from './TemplateSelector';
import { UpgradePrompt } from './UpgradePrompt';

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
      
      <UpgradePrompt
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="contact_responses"
      />
    </>
  );
}
```

---

### Step 8: Log Interaction Form

**File:** `src/components/contacts/LogInteractionForm.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Phone, Video, Mail, Home } from 'lucide-react';
import { format } from 'date-fns';
import { useInteractions } from '@/hooks/useInteractions';

interface LogInteractionFormProps {
  contactId: string;
  open: boolean;
  onClose: () => void;
}

const INTERACTION_TYPES = [
  { value: 'phone_call', label: 'Phone Call', icon: Phone },
  { value: 'meeting', label: 'Meeting', icon: Video },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'door_knock', label: 'Door Knock', icon: Home },
];

const OUTCOMES = [
  { value: 'interested', label: 'Interested' },
  { value: 'not_home', label: 'Not Home' },
  { value: 'rejected', label: 'Not Interested' },
  { value: 'follow_up_scheduled', label: 'Follow-Up Scheduled' },
];

export function LogInteractionForm({ contactId, open, onClose }: LogInteractionFormProps) {
  const [type, setType] = useState<string>('phone_call');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<string>('interested');
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  
  const { logInteraction, isLogging } = useInteractions();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    logInteraction({
      contact_id: contactId,
      interaction_type: type as any,
      notes,
      outcome: outcome as any,
      follow_up_date: followUpDate?.toISOString(),
    });
    
    // Reset form
    setType('phone_call');
    setNotes('');
    setOutcome('interested');
    setFollowUpDate(undefined);
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
          <DialogDescription>
            Track calls, meetings, or other interactions with this contact
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Interaction Type */}
          <div>
            <Label>Interaction Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {t.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          {/* Outcome */}
          <div>
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? What did you discuss?"
              rows={4}
            />
          </div>
          
          {/* Follow-up Date (conditional) */}
          {outcome === 'follow_up_scheduled' && (
            <div>
              <Label>Follow-Up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {followUpDate ? format(followUpDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={followUpDate}
                    onSelect={setFollowUpDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLogging}>
              {isLogging ? 'Logging...' : 'Log Interaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 9: Contact Detail Page

**File:** `src/pages/contacts/[id]/Detail.tsx`

```typescript
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
```

---

### Step 10: Contacts Index Page

**File:** `src/pages/contacts/Index.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Filter } from 'lucide-react';
import { ContactsTable } from '@/components/contacts/ContactsTable';

export default function ContactsIndex() {
  const [search, setSearch] = useState('');
  const [contactKind, setContactKind] = useState<string | undefined>();
  const [locationId, setLocationId] = useState<string | undefined>();
  
  const filters = {
    search: search || undefined,
    contact_kind: contactKind,
    location_id: locationId,
  };
  
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            People who've scanned your flyers
          </p>
        </div>
        
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={contactKind} onValueChange={setContactKind}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="lead">Leads</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="partner">Partners</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </Button>
      </div>
      
      {/* Table */}
      <ContactsTable filters={filters} />
    </div>
  );
}
```

---

## ✅ Acceptance Criteria

### Core Functionality
- [ ] Contacts table shows all captured contacts
- [ ] Data masking works on free tier (email/phone masked)
- [ ] "Unlock" buttons navigate to upgrade page
- [ ] Contact detail page shows full timeline
- [ ] Timeline shows scans, responses, and manual interactions
- [ ] Response time metrics calculated and displayed

### Gmail Integration
- [ ] "Respond" button checks feature gate
- [ ] Template selector modal opens
- [ ] Gmail compose opens in new tab with pre-filled template
- [ ] Response tracking logged to database
- [ ] Contact updated with last_contacted_at

### Manual Interactions
- [ ] "Log Interaction" form works
- [ ] Interaction types: call, meeting, email, door knock
- [ ] Outcome options: interested, not home, rejected, follow-up
- [ ] Follow-up date picker shown when outcome is "follow-up scheduled"
- [ ] Logged interactions appear in timeline

### Feature Gating
- [ ] Free tier sees masked email/phone
- [ ] Free tier sees upgrade prompt when clicking "Respond"
- [ ] Paid tier sees full contact details
- [ ] Paid tier can click "Respond" and open Gmail
- [ ] Usage limits enforced (from billing.plan_limits)

### User Experience
- [ ] Mobile responsive layout
- [ ] Loading states shown during API calls
- [ ] Error states handled gracefully
- [ ] Success toasts shown after actions
- [ ] Back navigation works correctly
- [ ] Timeline sorted newest-first

---

## 🧪 Manual Testing Script

### Test 1: Free Tier Experience
1. Log in with free tier account
2. Navigate to Contacts page
3. **Expected:** See contact name, masked email/phone
4. Click "Unlock" button
5. **Expected:** Redirect to upgrade page

### Test 2: Quick Response (Paid Tier)
1. Log in with paid tier account
2. View contact detail
3. Click "Respond" button
4. **Expected:** Template selector opens
5. Select template
6. **Expected:** Gmail compose opens in new tab with pre-filled email
7. Return to Attra
8. **Expected:** Timeline shows "You reached out" event

### Test 3: Log Manual Interaction
1. View contact detail
2. Click "Log Interaction"
3. Select "Phone Call"
4. Enter notes: "Discussed pricing, very interested"
5. Select outcome: "Follow-Up Scheduled"
6. Pick follow-up date: Tomorrow
7. Submit form
8. **Expected:** Timeline shows new phone call event with follow-up date

### Test 4: Attribution Timeline
1. Create QR scan for contact
2. Wait 30 minutes
3. Click "Respond" and open Gmail
4. View timeline
5. **Expected:** Shows scan event, then response event with "30m" response time
6. **Expected:** Green alert: "Great job! Fast responses increase conversion"

---

## 🎯 Future Enhancements

### Phase 2 Features (Not MVP):
1. **Gmail Response Detection**
   - Read replies from contacts
   - Show "Contact responded" in timeline
   - Calculate full conversation metrics

2. **Bulk Actions**
   - Select multiple contacts
   - Bulk export to CSV
   - Bulk tag updates

3. **Advanced Filtering**
   - Filter by date range
   - Filter by campaign source
   - Filter by response status

4. **Contact Scoring**
   - Lead score based on engagement
   - "Hot leads" indicator
   - Suggested next actions

---

## ✅ Completion Checklist

Before marking this file as complete:

- [ ] All code files created with complete implementations
- [ ] Schema contracts verified (contacts, interactions tables exist)
- [ ] Feature gating integrated (using file 08's system)
- [ ] Gmail quick response working (using backend 10a)
- [ ] Data masking logic implemented
- [ ] Timeline building and formatting working
- [ ] All components render without errors
- [ ] Mobile responsive design verified
- [ ] All acceptance criteria met
- [ ] Manual testing completed
- [ ] No console errors or warnings
- [ ] Git commit made with descriptive message

---

**File Complete:** This is a production-ready, executable command file.  
**Claude Code:** Execute each step in sequence. Do not skip steps.  
**Result:** Fully functional attribution-focused CRM with Gmail integration, data masking, and FOMO-driven upgrade incentives.
