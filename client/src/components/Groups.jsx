import React, { useState, useEffect } from 'react';
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { groupsAPI } from "../services/api";
import { 
  Search, Plus, Users, MapPin, Filter
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useNavigate } from 'react-router-dom';

const Groups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
    if (user) {
      fetchUserGroups();
    }
  }, [user, searchTerm, selectedCategory]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      };
      const response = await groupsAPI.getGroups(params);
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({ 
        title: "Error fetching groups", 
        description: error.response?.data?.message || "Failed to load groups",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const response = await groupsAPI.getUserGroups();
      setUserGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  };

  const categories = [
    { id: 'all', label: 'All', icon: '🌟' },
    { id: 'social', label: 'Social', icon: '☕' },
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'arts', label: 'Arts', icon: '🎨' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'food', label: 'Food', icon: '🍕' },
    { id: 'music', label: 'Music', icon: '🎵' },
  ];

  const handleJoinGroup = async (groupId) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      await groupsAPI.joinGroup(groupId);
      toast({ 
        title: "Joined group successfully!", 
        description: "You can now participate in group activities." 
      });
      fetchGroups();
      fetchUserGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({ 
        title: error.response?.data?.message || "Failed to join group", 
        variant: "destructive" 
      });
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await groupsAPI.leaveGroup(groupId);
      toast({ title: "Left group successfully" });
      fetchGroups();
      fetchUserGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({ title: "Failed to leave group", variant: "destructive" });
    }
  };

  const isUserMember = (groupId) => {
    return userGroups.some(g => g._id === groupId);
  };

  const joinedGroups = groups.filter(group => isUserMember(group._id));

  const getCategoryIcon = (category) => {
    const icons = {
      social: '☕',
      sports: '⚽',
      arts: '🎨',
      technology: '💻',
      food: '🍕',
      music: '🎵',
      travel: '✈️',
      fitness: '💪',
      gaming: '🎮',
      other: '👥'
    };
    return icons[category?.toLowerCase()] || '👥';
  };

  const getCategoryColor = (category) => {
    const colors = {
      social: 'bg-amber-100 text-amber-700',
      sports: 'bg-green-100 text-green-700',
      arts: 'bg-purple-100 text-purple-700',
      technology: 'bg-blue-100 text-blue-700',
      food: 'bg-orange-100 text-orange-700',
      music: 'bg-pink-100 text-pink-700',
      travel: 'bg-cyan-100 text-cyan-700',
      fitness: 'bg-red-100 text-red-700',
      gaming: 'bg-indigo-100 text-indigo-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Groups</h1>
          <p className="text-muted-foreground">
            You're active in {joinedGroups.length} groups • Discover new communities
          </p>
        </div>
        
        <Button 
          onClick={() => user ? navigate('/create-group') : navigate('/auth')} 
          className="bg-gradient-primary hover:bg-primary-hover shadow-soft"
        >
          <Plus className="h-4 w-4 mr-2" />
          {user ? 'Create Group' : 'Sign in to Create'}
        </Button>
      </div>

      {/* My Groups Section */}
      {joinedGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            My Groups ({joinedGroups.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {joinedGroups.map((group) => (
              <Card key={group._id} 
                    className="border-none shadow-card bg-card/70 backdrop-blur-sm hover:shadow-soft transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/group-details/${group._id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <img 
                      src={group.image || `https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=100&h=100&fit=crop`}
                      alt={group.name}
                      className="w-12 h-12 rounded-xl object-cover shadow-sm"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">{group.memberCount} members</p>
                    </div>
                    <Badge variant="secondary" className="bg-primary-light text-primary">
                      Joined
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {group.description}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {group.location || 'No location set'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-primary rounded-3xl p-8 text-primary-foreground mb-8 shadow-primary">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold mb-4">
            Discover Amazing
            <span className="block text-yellow-300">Communities</span>
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed mb-6">
            Break free from the cycle of stressful weekdays and empty weekends. 
            Join local communities that understand your journey and share your interests.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border"
            />
          </div>
          <Button variant="outline" className="border-border">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-gradient-primary'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <Card key={group._id} className="border-none shadow-card bg-card/70 backdrop-blur-sm hover:shadow-soft transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={group.image || `https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=100&h=100&fit=crop`}
                      alt={group.name}
                      className="w-14 h-14 rounded-xl object-cover shadow-sm"
                    />
                    <div className={`text-3xl p-2 rounded-lg ${getCategoryColor(group.category)}`}>
                      {getCategoryIcon(group.category)}
                    </div>
                  </div>
                </div>
                
                <h3 className="font-bold text-card-foreground mb-2 text-lg">{group.name}</h3>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{group.memberCount} members</span>
                    </div>
                    {group.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{group.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-3">
                  {group.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    {group.category}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate(`/group-details/${group._id}`)}
                    variant="outline"
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isUserMember(group._id)) {
                        handleLeaveGroup(group._id);
                      } else {
                        handleJoinGroup(group._id);
                      }
                    }}
                    className={`flex-1 ${
                      isUserMember(group._id)
                        ? 'bg-success hover:bg-success/90' 
                        : 'bg-gradient-primary hover:bg-primary-hover'
                    } shadow-soft`}
                  >
                    {isUserMember(group._id) ? 'Leave' : user ? 'Join' : 'Sign in to Join'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {groups.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No groups found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or browse different categories
          </p>
          <Button 
            onClick={() => navigate('/create-group')}
            variant="outline"
            className="border-border"
          >
            Create Your Own Group
          </Button>
        </div>
      )}
    </div>
  );
};

export default Groups;
