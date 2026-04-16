import React, { useState } from 'react';
import { 
  Edit3, MapPin, Calendar, Users, Activity, Heart, Star,
  Settings, LogOut, Camera, Mail, Phone, Save, X
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import Navigation from '../components/Navigation';

const ProfilePage = ({ navigate, user, setUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || 'Not set',
    interests: user?.interests?.join(', ') || ''
  });

  const handleSave = () => {
    const updatedUser = {
      ...user,
      ...editData,
      interests: editData.interests.split(',').map(i => i.trim()).filter(i => i)
    };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: user.name,
      email: user.email,
      bio: user.bio,
      location: user.location,
      interests: user.interests.join(', ')
    });
    setIsEditing(false);
  };

  const stats = [
    { label: 'Groups Joined', value: user?.groupsCount || 5, icon: Users, color: 'text-primary' },
    { label: 'Activities', value: user?.activitiesCount || 12, icon: Activity, color: 'text-success' },
    { label: 'Friends', value: user?.friends || 25, icon: Heart, color: 'text-pink-500' },
    { label: 'Member Since', value: user?.joinedDate || 'Recently', icon: Calendar, color: 'text-purple-500' }
  ];

  const recentActivity = [
    { title: 'Joined Weekend Coffee Explorers', date: '2 days ago', type: 'group' },
    { title: 'Completed Morning Yoga Session', date: '3 days ago', type: 'activity' },
    { title: 'Posted in Book Club Discussion', date: '1 week ago', type: 'post' },
    { title: 'Connected with Sarah Chen', date: '1 week ago', type: 'friend' }
  ];

  const achievements = [
    { title: 'Community Builder', description: 'Joined 5+ groups', icon: '🏆' },
    { title: 'Active Participant', description: '10+ activities completed', icon: '⭐' },
    { title: 'Social Butterfly', description: 'Connected with 25+ members', icon: '🦋' },
    { title: 'Early Adopter', description: 'Among first 100 members', icon: '🚀' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <Card className="border-none shadow-card bg-card/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <Button 
                          size="icon"
                          variant="secondary"
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-soft"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="space-y-3">
                            <Input
                              value={editData.name}
                              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                              className="text-xl font-bold border-border"
                            />
                            <Input
                              value={editData.email}
                              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                              className="border-border"
                            />
                          </div>
                        ) : (
                          <div>
                            <h1 className="text-3xl font-bold text-card-foreground mb-2">
                              {user?.email?.split('@')[0] || 'User'}
                            </h1>
                            <div className="flex items-center space-x-4 text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-4 w-4" />
                                <span>{user?.email || 'No email'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{user?.location || 'Not set'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <Button onClick={handleSave} size="sm" className="bg-success hover:bg-success/90">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button onClick={handleCancel} variant="outline" size="sm">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-card-foreground mb-2">About</h3>
                    {isEditing ? (
                      <Textarea
                        value={editData.bio}
                        onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={3}
                        className="border-border"
                      />
                    ) : (
                      <p className="text-muted-foreground leading-relaxed">{user?.bio || 'No bio yet'}</p>
                    )}
                  </div>

                  {/* Interests */}
                  <div>
                    <h3 className="font-semibold text-card-foreground mb-3">Interests</h3>
                    {isEditing ? (
                      <Input
                        value={editData.interests}
                        onChange={(e) => setEditData(prev => ({ ...prev, interests: e.target.value }))}
                        placeholder="Enter interests separated by commas"
                        className="border-border"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(user?.interests || ['Coding', 'Coffee', 'Photography']).map((interest, index) => (
                          <Badge key={index} variant="secondary" className="bg-accent text-accent-foreground">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <Card key={index} className="border-none shadow-card bg-card/70 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                      <div className="text-2xl font-bold text-card-foreground mb-1">
                        {stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Achievements */}
              <Card className="border-none shadow-card bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-card-foreground flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div>
                          <h4 className="font-semibold text-accent-foreground">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="border-none shadow-card bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-card-foreground">Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start border-border">
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Button>
                  <Button 
                    onClick={onLogout}
                    variant="outline" 
                    className="w-full justify-start border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-none shadow-card bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-card-foreground">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ProfilePage;