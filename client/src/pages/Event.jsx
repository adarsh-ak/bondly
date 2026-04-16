import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventsAPI, groupsAPI } from "../services/api";
import { toast } from "../hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { format } from "date-fns";
import { X, Calendar, Clock, MapPin, Users, Link2 } from "lucide-react";

const Events = ({ user }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    group_id: "",
    event_date: new Date().toISOString().split("T")[0],
    event_time: "12:00",
    location: "",
    virtualLink: "",
    maxAttendees: "",
  });

  // Fetch events and user groups
  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchMyEvents();
      fetchUserGroups();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEvents();
      if (response.success) setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const response = await eventsAPI.getUserUpcomingEvents();
      if (response.success) setMyEvents(response.data);
    } catch (error) {
      console.error("Error fetching my events:", error);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const response = await groupsAPI.getUserGroups();
      if (response.success) setUserGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const resetEventForm = () => {
    setNewEvent({
      title: "",
      description: "",
      group_id: "",
      event_date: new Date().toISOString().split("T")[0],
      event_time: "12:00",
      location: "",
      virtualLink: "",
      maxAttendees: "",
    });
  };

  const createEvent = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/auth");

    try {
      const startDateTime = new Date(
        `${newEvent.event_date}T${newEvent.event_time}`
      );
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        group: newEvent.group_id,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: newEvent.location,
        eventType: "In-Person",
        virtualLink: newEvent.virtualLink || "",
        maxAttendees: newEvent.maxAttendees
          ? parseInt(newEvent.maxAttendees)
          : undefined,
        isPublic: true,
      };

      const response = await eventsAPI.createEvent(eventData);

      if (response.success) {
        toast({ title: "Success", description: "Event created successfully!" });
        setIsCreateDialogOpen(false);
        resetEventForm();
        fetchEvents();
        fetchMyEvents();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create event",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating event:", error.response || error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create event",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events</h1>

        {/* Create Event Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">Create New Event</Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
            {/* Header */}
            <DialogHeader className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    Create New Event
                  </DialogTitle>
                  <DialogDescription className="text-sm mt-1">
                    Fill in the details below to create a new event for your group.
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            {/* Scrollable Form */}
            <div className="overflow-y-auto px-6 py-6 max-h-[calc(90vh-180px)]">
              <form onSubmit={createEvent} className="space-y-6 pb-4">
                {/* Event Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Event Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Summer Meetup 2024"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    required
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your event..."
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    required
                    rows={4}
                    className="w-full resize-none"
                  />
                </div>

                {/* Group Selection */}
                <div className="space-y-2">
                  <Label htmlFor="group" className="text-sm font-medium">
                    Group *
                  </Label>
                  <Select
                    value={newEvent.group_id}
                    onValueChange={(value) =>
                      setNewEvent({ ...newEvent, group_id: value })
                    }
                    required
                  >
                    <SelectTrigger id="group" className="w-full">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {userGroups.map((group) => (
                        <SelectItem key={group._id || group.id} value={group._id || group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.event_date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, event_date: e.target.value })
                      }
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time *
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.event_time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, event_time: e.target.value })
                      }
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Central Park, New York"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                    required
                    className="w-full"
                  />
                </div>

                {/* Virtual Link */}
                <div className="space-y-2">
                  <Label htmlFor="virtualLink" className="text-sm font-medium flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Virtual Link (Optional)
                  </Label>
                  <Input
                    id="virtualLink"
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    value={newEvent.virtualLink}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, virtualLink: e.target.value })
                    }
                    className="w-full"
                  />
                </div>

                {/* Max Attendees */}
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Max Attendees (Optional)
                  </Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    min="1"
                    placeholder="e.g., 50"
                    value={newEvent.maxAttendees}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        maxAttendees: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>
              </form>
            </div>

            {/* Footer with Buttons */}
            <div className="px-6 py-4 border-t bg-muted/30 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" onClick={createEvent}>
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* All Events Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">All Events</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading events...</p>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card key={event._id || event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                  <div className="pt-2 space-y-1">
                    <p className="text-sm font-medium">
                      {event.group?.name || "No group"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.startDate), "PPP p")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No events available.</p>
        )}
      </section>

      {/* My Upcoming Events Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">My Upcoming Events</h2>
        {myEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myEvents.map((event) => (
              <Card key={event._id || event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                  <div className="pt-2 space-y-1">
                    <p className="text-sm font-medium">
                      {event.group?.name || "No group"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.startDate), "PPP p")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No upcoming events yet.</p>
        )}
      </section>
    </div>
  );
};

export default Events;