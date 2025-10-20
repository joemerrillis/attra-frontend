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
import { MapPin } from 'lucide-react';
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
