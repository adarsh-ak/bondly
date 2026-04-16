import React, { useState } from 'react';
import { ArrowLeft, Camera, Image, Video, MapPin, Users, Send } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import Navigation from '../components/Navigation';

const UploadPost = ({ navigate, user }) => {
  const [postData, setPostData] = useState({
    content: '',
    activity: '',
    location: '',
    privacy: 'public'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle post submission
    navigate('feed');
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('feed')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Share Your Experience</h1>
            <p className="text-muted-foreground text-lg">
              Tell your community about your latest activity or adventure
            </p>
          </div>

          <Card className="border-none shadow-card bg-card/80 backdrop-blur-sm mb-6">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-card-foreground">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">Sharing to community</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Textarea
                    value={postData.content}
                    onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="What did you do today? Share your community experience..."
                    rows={4}
                    className="border-border resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                      Activity Type
                    </label>
                    <Input
                      type="text"
                      value={postData.activity}
                      onChange={(e) => setPostData(prev => ({ ...prev, activity: e.target.value }))}
                      placeholder="e.g., Morning Yoga, Book Club"
                      className="border-border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={postData.location}
                        onChange={(e) => setPostData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Where did this happen?"
                        className="pl-10 border-border"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div className="flex items-center space-x-2">
                    <Button type="button" variant="ghost" size="sm" className="text-primary">
                      <Image className="h-4 w-4 mr-2" />
                      Add Photo
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-primary">
                      <Video className="h-4 w-4 mr-2" />
                      Add Video
                    </Button>
                  </div>

                  <Button 
                    type="submit"
                    className="bg-gradient-primary hover:bg-primary-hover"
                    disabled={!postData.content.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Share Post
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Upload Options */}
          <div className="grid gap-4 mb-8">
            <Card className="border-none shadow-card bg-card/70 backdrop-blur-sm cursor-pointer hover:shadow-soft transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Image className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-card-foreground mb-1">Upload Photo</h3>
                    <p className="text-muted-foreground">Share photos from your community activities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-card bg-card/70 backdrop-blur-sm cursor-pointer hover:shadow-soft transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Video className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-card-foreground mb-1">Upload Video</h3>
                    <p className="text-muted-foreground">Share video moments from your sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <Card className="border-none shadow-card bg-card/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Sharing Tips
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Share authentic moments from your community activities
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Include details about your experience and what you learned
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Tag your activity type to help others find similar content
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Be encouraging and welcoming to inspire others to join
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default UploadPost;