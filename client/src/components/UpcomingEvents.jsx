import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Clock, AlertCircle } from 'lucide-react';
import { eventsAPI } from '../services/api';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await eventsAPI.getUserUpcomingEvents();
      const eventData = response?.data || response?.events || [];
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err) {
      if (err.message.includes('<!doctype') || err.message.includes('Unexpected token')) {
        setError('Backend server is not responding. Please ensure the API server is running on the correct port.');
      } else if (err.response?.status === 404) {
        setError('API endpoint not found. Please check your backend routes.');
      } else if (err.response?.status === 401) {
        setError('Unauthorized. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Could not load upcoming events. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'TBA';
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return 'TBA';
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border mb-8">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Events
        </h2>
        <button className="text-sm text-primary hover:text-primary/80 font-medium">
          View All
        </button>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={fetchEvents}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-foreground mb-2">No upcoming events</p>
            <p className="text-muted-foreground text-sm">Join groups to see their events here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event._id || event.id}
                className="flex items-start space-x-4 p-4 bg-muted rounded-lg hover:bg-accent transition-colors border border-border"
              >
                <div className="flex flex-col items-center justify-center bg-accent rounded-lg p-3 min-w-[70px] border border-border">
                  <p className="text-xs text-muted-foreground uppercase font-medium">
                    {formatDate(event.date || event.startDate).split(' ')[0]}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatDate(event.date || event.startDate).split(' ')[1]}
                  </p>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1 truncate">
                    {event.title || event.name}
                  </h3>
                  
                  {event.group && (
                    <span className="inline-block px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded mb-2">
                      {event.group.name || event.group}
                    </span>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{event.time || formatTime(event.date || event.startDate)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {Array.isArray(event.attendees) 
                          ? event.attendees.length 
                          : Array.isArray(event.participants)
                          ? event.participants.length
                          : event.attendeeCount || 0} attending
                      </span>
                    </div>
                  </div>
                </div>
                
                <button className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEvents;