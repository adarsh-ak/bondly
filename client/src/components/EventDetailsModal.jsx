import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calendar, MapPin, Users, Clock, User } from "lucide-react";
import { format } from "date-fns";

const EventDetailsModal = ({ event, isOpen, onClose, onJoinEvent, user }) => {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {event.group_name}
            </Badge>
            {event.is_participant && (
              <Badge variant="default" className="text-sm">
                Going
              </Badge>
            )}
          </div>

          {event.description && (
            <div>
              <h3 className="font-semibold mb-2">About this event</h3>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <div>
                <p className="font-medium text-foreground">
                  {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm">
                  {format(new Date(event.event_date), 'h:mm a')}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <p>{event.location}</p>
              </div>
            )}

            <div className="flex items-center gap-3 text-muted-foreground">
              <Users className="h-5 w-5" />
              <p>{event.participant_count || 0} people attending</p>
            </div>
          </div>

          {user && onJoinEvent && (
            <Button
              onClick={() => onJoinEvent(event.id, !event.is_participant)}
              className="w-full"
              variant={event.is_participant ? "outline" : "default"}
            >
              {event.is_participant ? 'Leave Event' : 'Join Event'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsModal;