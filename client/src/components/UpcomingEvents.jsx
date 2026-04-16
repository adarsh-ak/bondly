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
      console.log('Fetching events from API...'); // Debug
      const response = await eventsAPI.getUserUpcomingEvents();
      console.log('API Response:', response); // Debug log
      
      // Handle different response structures
      const eventData = response?.data || response?.events || [];
      console.log('Event data:', eventData); // Debug
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err) {
      console.error('Error fetching events:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      
      // Check if it's a network/CORS error
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Upcoming Events
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchEvents}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No upcoming events</p>
            <p className="text-gray-500 text-sm">Join groups to see their events here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event._id || event.id}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-3 min-w-[70px] border border-blue-200">
                  <p className="text-xs text-gray-600 uppercase font-medium">
                    {formatDate(event.date || event.startDate).split(' ')[0]}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatDate(event.date || event.startDate).split(' ')[1]}
                  </p>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {event.title || event.name}
                  </h3>
                  
                  {event.group && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded mb-2">
                      {event.group.name || event.group}
                    </span>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                
                <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
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