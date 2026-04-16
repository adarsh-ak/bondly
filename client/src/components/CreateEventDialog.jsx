import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Users, Video, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CreateEventDialog = ({ open, onOpenChange, groupId, onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    eventType: 'In-Person',
    virtualLink: '',
    maxAttendees: '',
    coverImage: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_URL}/events`,
        {
          ...formData,
          group: groupId,
          maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Event created successfully!'
        });
        onEventCreated?.();
        onOpenChange(false);
        setFormData({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          location: '',
          eventType: 'In-Person',
          virtualLink: '',
          maxAttendees: '',
          coverImage: ''
        });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create event',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Event Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Weekend Coffee Meetup"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Description *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              placeholder="Describe what the event is about..."
              required
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Start Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                End Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Event Type *
            </label>
            <Select value={formData.eventType} onValueChange={(value) => handleChange('eventType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In-Person">In-Person</SelectItem>
                <SelectItem value="Virtual">Virtual</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Location {formData.eventType === 'Virtual' ? '(Optional)' : '*'}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Central Park, New York"
                required={formData.eventType !== 'Virtual'}
                maxLength={200}
                className="pl-10"
              />
            </div>
          </div>

          {(formData.eventType === 'Virtual' || formData.eventType === 'Hybrid') && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Virtual Meeting Link
              </label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="url"
                  value={formData.virtualLink}
                  onChange={(e) => handleChange('virtualLink', e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Max Attendees (Optional)
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) => handleChange('maxAttendees', e.target.value)}
                  placeholder="No limit"
                  min="1"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Cover Image URL (Optional)
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => handleChange('coverImage', e.target.value)}
                  placeholder="https://..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-primary hover:bg-primary-hover"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;