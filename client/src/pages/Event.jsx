/**
 * pages/Event.jsx  (full rewrite)
 *
 * What's new:
 *  - Tabs: Upcoming | Past
 *  - Upcoming events: Edit button shown to organizer/group-admin → inline edit dialog
 *  - Past events: click any card → full detail modal (description, attendees, location, etc.)
 *  - Join / Leave on upcoming event cards
 *  - All data from real API — no mocks
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar, Clock, MapPin, Users, Link2,
  X, Edit2, Pencil, Eye, UserPlus, UserMinus,
  Loader2, AlertCircle, ChevronDown, ChevronUp,
  Trophy,
} from 'lucide-react';
import { Button }   from '../components/ui/button';
import { Input }    from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label }    from '../components/ui/label';
import { Badge }    from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth }  from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { eventsAPI, groupsAPI } from '../services/api';

// ── helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'EEE, MMM d yyyy'); } catch { return '—'; }
}
function fmtTime(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'h:mm a'); } catch { return '—'; }
}
function fmtDateTime(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'EEE, MMM d yyyy · h:mm a'); } catch { return '—'; }
}

function StatusBadge({ status }) {
  const map = {
    upcoming  : 'bg-green-100 text-green-700',
    ongoing   : 'bg-blue-100 text-blue-700',
    completed : 'bg-purple-100 text-purple-600',
    cancelled : 'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ── Edit Event Dialog ──────────────────────────────────────────────────────────
function EditEventDialog({ event, open, onClose, onSaved }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const toDateLocal = (iso) => {
    if (!iso) return '';
    try { return format(new Date(iso), "yyyy-MM-dd"); } catch { return ''; }
  };
  const toTimeLocal = (iso) => {
    if (!iso) return '';
    try { return format(new Date(iso), "HH:mm"); } catch { return ''; }
  };

  const [form, setForm] = useState({
    title       : event?.title        || '',
    description : event?.description  || '',
    startDate   : toDateLocal(event?.startDate),
    startTime   : toTimeLocal(event?.startDate),
    location    : event?.location     || '',
    eventType   : event?.eventType    || 'In-Person',
    virtualLink : event?.virtualLink  || '',
    maxAttendees: event?.maxAttendees ? String(event.maxAttendees) : '',
  });

  // reset whenever a different event is opened
  useEffect(() => {
    if (!event) return;
    setForm({
      title       : event.title        || '',
      description : event.description  || '',
      startDate   : toDateLocal(event.startDate),
      startTime   : toTimeLocal(event.startDate),
      location    : event.location     || '',
      eventType   : event.eventType    || 'In-Person',
      virtualLink : event.virtualLink  || '',
      maxAttendees: event.maxAttendees ? String(event.maxAttendees) : '',
    });
  }, [event?._id]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate || !form.startTime) {
      toast({ title: 'Title, date and time are required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const startISO = new Date(`${form.startDate}T${form.startTime}`).toISOString();
      await eventsAPI.updateEvent(event._id, {
        title       : form.title.trim(),
        description : form.description.trim(),
        startDate   : startISO,
        location    : form.location.trim(),
        eventType   : form.eventType,
        virtualLink : form.virtualLink.trim(),
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : undefined,
      });
      toast({ title: '✅ Event updated successfully!' });
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: err.message || 'Failed to update event.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Edit Event
          </DialogTitle>
          <DialogDescription>
            Only upcoming events can be edited. Changes are visible to all attendees.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Event Title <span className="text-destructive">*</span></Label>
            <Input maxLength={100} value={form.title}
              onChange={(e) => set('title', e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} maxLength={2000} value={form.description}
              onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Date <span className="text-destructive">*</span>
              </Label>
              <Input type="date" value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Time <span className="text-destructive">*</span>
              </Label>
              <Input type="time" value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Location
            </Label>
            <Input value={form.location} maxLength={200}
              placeholder="e.g., Central Park, New York"
              onChange={(e) => set('location', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Event Type</Label>
            <Select value={form.eventType} onValueChange={(v) => set('eventType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="In-Person">In-Person</SelectItem>
                <SelectItem value="Virtual">Virtual</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(form.eventType === 'Virtual' || form.eventType === 'Hybrid') && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" /> Virtual Link
              </Label>
              <Input type="url" value={form.virtualLink}
                placeholder="https://zoom.us/j/..."
                onChange={(e) => set('virtualLink', e.target.value)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Max Attendees (optional)
            </Label>
            <Input type="number" min="1" value={form.maxAttendees}
              placeholder="No limit"
              onChange={(e) => set('maxAttendees', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Past Event Detail Modal ────────────────────────────────────────────────────
function PastEventModal({ event, open, onClose }) {
  if (!event) return null;
  const going = event.attendees?.filter((a) => a.status === 'going') || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="text-xl leading-tight">{event.title}</DialogTitle>
              {event.group?.name && (
                <p className="text-sm text-muted-foreground mt-0.5">{event.group.name}</p>
              )}
            </div>
            <StatusBadge status={event.status} />
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Core details */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>{fmtDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>{fmtTime(event.startDate)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">{going.length}</strong> attended
                {event.maxAttendees ? ` / ${event.maxAttendees} max` : ''}
              </span>
            </div>
            {event.eventType && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>{event.eventType}</span>
              </div>
            )}
            {event.virtualLink && (
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href={event.virtualLink} target="_blank" rel="noopener noreferrer"
                  className="text-primary underline text-sm truncate">{event.virtualLink}</a>
              </div>
            )}
          </div>

          {/* Organiser */}
          {event.organizer && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Organiser
              </p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {(event.organizer.username || 'O').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{event.organizer.username}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                About this event
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Full attendee list */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Attendees ({going.length})
            </p>
            {going.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No attendees recorded.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {going.map((a, i) => {
                  const name     = a.user?.username || a.user?.fullName || 'Member';
                  const fullName = a.user?.fullName;
                  const initials = name.charAt(0).toUpperCase();
                  return (
                    <div key={a.user?._id || i}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[11px] bg-primary/20 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{name}</p>
                        {fullName && fullName !== name && (
                          <p className="text-[10px] text-muted-foreground truncate">{fullName}</p>
                        )}
                      </div>
                      {a.registeredAt && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {format(new Date(a.registeredAt), 'MMM d')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Event Dialog ────────────────────────────────────────────────────────
function CreateEventDialog({ open, onClose, userGroups, onCreated }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', group_id: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '12:00', location: '', virtualLink: '',
    maxAttendees: '', eventType: 'In-Person',
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const reset = () => setForm({
    title: '', description: '', group_id: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '12:00', location: '', virtualLink: '',
    maxAttendees: '', eventType: 'In-Person',
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.group_id) {
      toast({ title: 'Title and group are required.', variant: 'destructive' }); return;
    }
    setLoading(true);
    try {
      const startISO = new Date(`${form.event_date}T${form.event_time}`).toISOString();
      const endISO   = new Date(new Date(startISO).getTime() + 2 * 3600 * 1000).toISOString();
      await eventsAPI.createEvent({
        title       : form.title.trim(),
        description : form.description.trim(),
        group       : form.group_id,
        startDate   : startISO,
        endDate     : endISO,
        location    : form.location.trim(),
        eventType   : form.eventType,
        virtualLink : form.virtualLink.trim(),
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : undefined,
        isPublic    : true,
      });
      toast({ title: '🎉 Event created!' });
      reset(); onCreated(); onClose();
    } catch (err) {
      toast({ title: err.message || 'Failed to create event.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>Fill in the details to create an event for your group.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Event Title <span className="text-destructive">*</span></Label>
            <Input maxLength={100} value={form.title} placeholder="e.g., Summer Meetup 2025"
              onChange={(e) => set('title', e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} maxLength={2000} value={form.description}
              placeholder="Describe your event…"
              onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Group <span className="text-destructive">*</span></Label>
            <Select value={form.group_id} onValueChange={(v) => set('group_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select a group" /></SelectTrigger>
              <SelectContent>
                {userGroups.map((g) => (
                  <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Date <span className="text-destructive">*</span>
              </Label>
              <Input type="date" value={form.event_date}
                onChange={(e) => set('event_date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Time <span className="text-destructive">*</span>
              </Label>
              <Input type="time" value={form.event_time}
                onChange={(e) => set('event_time', e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Location</Label>
            <Input value={form.location} maxLength={200} placeholder="e.g., Central Park"
              onChange={(e) => set('location', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Event Type</Label>
            <Select value={form.eventType} onValueChange={(v) => set('eventType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="In-Person">In-Person</SelectItem>
                <SelectItem value="Virtual">Virtual</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(form.eventType === 'Virtual' || form.eventType === 'Hybrid') && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5" /> Virtual Link</Label>
              <Input type="url" value={form.virtualLink} placeholder="https://zoom.us/j/..."
                onChange={(e) => set('virtualLink', e.target.value)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Max Attendees (optional)</Label>
            <Input type="number" min="1" value={form.maxAttendees} placeholder="No limit"
              onChange={(e) => set('maxAttendees', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Upcoming Event Card ────────────────────────────────────────────────────────
function UpcomingCard({ event, currentUserId, userGroupIds, onJoin, onLeave, onEdit, onRefresh }) {
  const going    = event.attendees?.filter((a) => a.status === 'going') || [];
  const now      = Date.now();
  const isFuture = new Date(event.startDate).getTime() > now;
  const attending = event.attendees?.some(
    (a) => (a.user?._id || a.user) === currentUserId
  );
  const canEdit =
    isFuture && (
      event.organizer?._id === currentUserId ||
      event.organizer === currentUserId
    );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{event.title}</h3>
            {event.group?.name && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {event.group.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusBadge status={event.status} />
            {canEdit && (
              <button
                onClick={() => onEdit(event)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Edit event"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{fmtDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{fmtTime(event.startDate)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              <strong className="text-foreground">{going.length}</strong> attending
              {event.maxAttendees ? ` / ${event.maxAttendees} max` : ''}
            </span>
          </div>
        </div>

        {/* Description snippet */}
        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
        )}

        {/* Attendee avatars */}
        {going.length > 0 && (
          <div className="flex items-center gap-1">
            {going.slice(0, 5).map((a, i) => {
              const name = a.user?.username || 'U';
              return (
                <Avatar key={a.user?._id || i} className="h-6 w-6 -ml-1 first:ml-0 border border-background">
                  <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {going.length > 5 && (
              <span className="text-[10px] text-muted-foreground ml-1">+{going.length - 5} more</span>
            )}
          </div>
        )}

        {/* Join / Leave */}
        <Button
          size="sm"
          variant={attending ? 'outline' : 'default'}
          className={`w-full h-8 text-xs ${attending ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}`}
          onClick={() => attending ? onLeave(event._id) : onJoin(event._id)}
        >
          {attending
            ? <><UserMinus className="h-3.5 w-3.5 mr-1.5" />Leave Event</>
            : <><UserPlus className="h-3.5 w-3.5 mr-1.5" />Join Event</>}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Past Event Card ────────────────────────────────────────────────────────────
function PastCard({ event, onClick }) {
  const going = event.attendees?.filter((a) => a.status === 'going') || [];
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onClick(event)}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            {event.group?.name && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {event.group.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusBadge status={event.status} />
            <Eye className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />{fmtDate(event.startDate)}
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /><span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span><strong className="text-foreground">{going.length}</strong> attended</span>
          </div>
        </div>

        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
        )}

        <p className="text-[11px] text-primary font-medium">Click to see full details →</p>
      </CardContent>
    </Card>
  );
}

// ── Main Events Page ───────────────────────────────────────────────────────────
export default function Events() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [tab,         setTab]         = useState('upcoming');
  const [upcoming,    setUpcoming]    = useState([]);
  const [past,        setPast]        = useState([]);
  const [userGroups,  setUserGroups]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // dialog state
  const [createOpen,  setCreateOpen]  = useState(false);
  const [editEvent,   setEditEvent]   = useState(null);  // event being edited
  const [detailEvent, setDetailEvent] = useState(null);  // past event detail

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchUpcoming = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // Pull ALL events from user's groups (backend now syncs status first)
      const d = await eventsAPI.getUserUpcomingEvents();
      const now = Date.now();
      // Client-side guard: only show events whose startDate is still in the future
      const upcomingEvs = (d.data || []).filter(
        (e) => e.status !== 'cancelled' && new Date(e.startDate).getTime() > now
      );
      setUpcoming(upcomingEvs.sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)  // soonest first
      ));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchPast = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // Fetch all events (backend syncs status), then filter client-side
      const d = await eventsAPI.getEvents({ limit: 200 });
      const now = Date.now();
      const pastEvs = (d.data || []).filter(
        (e) => new Date(e.startDate).getTime() <= now || e.status === 'cancelled'
      );
      setPast(pastEvs.sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate)  // most recent first
      ));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const d = await groupsAPI.getUserGroups();
      setUserGroups(d.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchGroups();
    fetchUpcoming();
  }, [user]);

  useEffect(() => {
    if (tab === 'past') fetchPast();
    if (tab === 'upcoming') fetchUpcoming();
  }, [tab]);

  // ── join / leave ──────────────────────────────────────────────────────────
  const handleJoin = async (eventId) => {
    try {
      await eventsAPI.joinEvent(eventId, 'going');
      toast({ title: '✅ You joined this event!' });
      fetchUpcoming();
    } catch (e) { toast({ title: e.message || 'Could not join.', variant: 'destructive' }); }
  };

  const handleLeave = async (eventId) => {
    try {
      await eventsAPI.leaveEvent(eventId);
      toast({ title: 'You left this event.' });
      fetchUpcoming();
    } catch (e) { toast({ title: e.message || 'Could not leave.', variant: 'destructive' }); }
  };

  const currentUserId = user?._id || user?.id;
  const userGroupIds  = userGroups.map((g) => g._id);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and explore events from your groups
          </p>
        </div>
        {user && (
          <Button onClick={() => setCreateOpen(true)}>
            + Create Event
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {['upcoming', 'past'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
            {t === 'upcoming' && upcoming.length > 0 && (
              <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm">{error}</p>
          <Button size="sm" variant="outline"
            onClick={() => tab === 'upcoming' ? fetchUpcoming() : fetchPast()}>
            Try Again
          </Button>
        </div>
      ) : tab === 'upcoming' ? (
        upcoming.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-3">
            <Calendar className="h-12 w-12 mx-auto opacity-30" />
            <p>No upcoming events from your groups.</p>
            <Button size="sm" onClick={() => navigate('/groups')}>Browse Groups</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((ev) => (
              <UpcomingCard
                key={ev._id}
                event={ev}
                currentUserId={currentUserId}
                userGroupIds={userGroupIds}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onEdit={setEditEvent}
                onRefresh={fetchUpcoming}
              />
            ))}
          </div>
        )
      ) : (
        past.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-3">
            <Calendar className="h-12 w-12 mx-auto opacity-30" />
            <p>No past events found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.map((ev) => (
              <PastCard key={ev._id} event={ev} onClick={setDetailEvent} />
            ))}
          </div>
        )
      )}

      {/* Dialogs */}
      <CreateEventDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        userGroups={userGroups}
        onCreated={fetchUpcoming}
      />

      <EditEventDialog
        event={editEvent}
        open={!!editEvent}
        onClose={() => setEditEvent(null)}
        onSaved={fetchUpcoming}
      />

      <PastEventModal
        event={detailEvent}
        open={!!detailEvent}
        onClose={() => setDetailEvent(null)}
      />
    </div>
  );
}