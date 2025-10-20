import { format, formatDistanceToNow } from 'date-fns';

export type TimelineEventType =
  | 'scan'
  | 'contact_created'
  | 'email_sent'
  | 'email_received'
  | 'phone_call'
  | 'meeting'
  | 'follow_up_scheduled'
  | 'door_knock';

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
