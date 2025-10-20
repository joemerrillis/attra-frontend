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
