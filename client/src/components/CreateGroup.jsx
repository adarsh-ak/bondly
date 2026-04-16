import React, { useState } from 'react';
import { ArrowLeft, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { groupsAPI } from '../services/api';
import Navigation from '../components/Navigation';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'interest',
    location: '',
    image: ''
  });

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to create a group',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const response = await groupsAPI.createGroup({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        location: formData.location,
        image: formData.image || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400'
      });

      if (response.success) {
        toast({
          title: 'Success!',
          description: 'Group created successfully!'
        });
        navigate('/groups');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create group. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/groups')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Your Community</h1>
          <p className="text-muted-foreground text-lg">
            Start a new group and bring people together around shared interests
          </p>
        </div>

        <Card className="border-none shadow-card bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-card-foreground">Group Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Community Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Weekend Coffee Explorers"
                  required
                  maxLength={100}
                  className="border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  placeholder="Describe what your community is about, what activities you'll do, and what kind of people you'd like to attract..."
                  required
                  maxLength={500}
                  className="border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-2">
                    Group Type *
                  </label>
                  <Select 
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interest">Interest - Hobbies & Activities</SelectItem>
                      <SelectItem value="necessity">Necessity - Essential Services</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose "Interest" for hobbies, sports, arts. Choose "Necessity" for housing, tutoring, transport, etc.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-2">
                      Category *
                    </label>
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => handleChange('category', value)}
                    >
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="arts">Arts</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-card-foreground mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="e.g., Downtown Area"
                        maxLength={100}
                        className="pl-10 border-border"
                      />
                    </div>
                  </div>
                </div>

              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">
                  Group Image URL (Optional)
                </label>
                <Input
                  type="url"
                  value={formData.image}
                  onChange={(e) => handleChange('image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for default image
                </p>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:bg-primary-hover"
                  disabled={!formData.name || !formData.description || !formData.category || loading}
                >
                  {loading ? 'Creating...' : 'Create Community'}
                </Button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-accent rounded-lg">
              <h3 className="font-semibold text-accent-foreground mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Tips for Success
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be specific about what activities your group will do</li>
                <li>• Set clear expectations for frequency and commitment</li>
                <li>• Choose a welcoming and inclusive tone</li>
                <li>• Consider starting with a simple first meetup</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
};

export default CreateGroup;