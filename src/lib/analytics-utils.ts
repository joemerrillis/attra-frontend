import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

export interface DashboardMetrics {
  totalScans: number;
  totalContacts: number;
  conversionRate: number;
  avgResponseTime: string;
  activeCampaigns: number;
}

export interface TimeSeriesData {
  date: string;
  scans: number;
  contacts: number;
}

export interface LocationData {
  name: string;
  scans: number;
  contacts: number;
  conversionRate: number;
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(scans: number, contacts: number): number {
  if (scans === 0) return 0;
  return Math.round((contacts / scans) * 100);
}

/**
 * Format response time from seconds
 */
export function formatResponseTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Generate time series data from scans/contacts
 */
export function generateTimeSeries(
  scans: any[],
  contacts: any[],
  days: number = 30
): TimeSeriesData[] {
  const endDate = new Date();
  const startDate = subDays(endDate, days);

  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  return dateRange.map(date => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const dayScans = scans.filter(s => {
      const scanDate = new Date(s.scanned_at);
      return scanDate >= dayStart && scanDate <= dayEnd;
    }).length;

    const dayContacts = contacts.filter(c => {
      const contactDate = new Date(c.created_at);
      return contactDate >= dayStart && contactDate <= dayEnd;
    }).length;

    return {
      date: format(date, 'MMM d'),
      scans: dayScans,
      contacts: dayContacts,
    };
  });
}

/**
 * Aggregate data by location
 */
export function aggregateByLocation(
  scans: any[],
  contacts: any[]
): LocationData[] {
  const locationMap = new Map<string, { scans: number; contacts: number }>();

  // Count scans per location
  scans.forEach(scan => {
    const locationName = scan.location?.name || 'Unknown';
    const current = locationMap.get(locationName) || { scans: 0, contacts: 0 };
    locationMap.set(locationName, { ...current, scans: current.scans + 1 });
  });

  // Count contacts per location
  contacts.forEach(contact => {
    const locationName = contact.location?.name || 'Unknown';
    const current = locationMap.get(locationName) || { scans: 0, contacts: 0 };
    locationMap.set(locationName, { ...current, contacts: current.contacts + 1 });
  });

  // Convert to array and calculate conversion rates
  return Array.from(locationMap.entries())
    .map(([name, data]) => ({
      name,
      scans: data.scans,
      contacts: data.contacts,
      conversionRate: calculateConversionRate(data.scans, data.contacts),
    }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 10); // Top 10 locations
}

/**
 * Calculate funnel metrics
 */
export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
}

export function calculateFunnel(
  scans: number,
  contacts: number,
  responses: number
): FunnelStage[] {
  return [
    {
      name: 'Scans',
      count: scans,
      percentage: 100,
    },
    {
      name: 'Contacts Captured',
      count: contacts,
      percentage: scans > 0 ? Math.round((contacts / scans) * 100) : 0,
    },
    {
      name: 'Responses Sent',
      count: responses,
      percentage: contacts > 0 ? Math.round((responses / contacts) * 100) : 0,
    },
  ];
}
