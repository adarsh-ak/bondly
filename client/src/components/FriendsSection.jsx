import { useState, useEffect } from 'react';
import { Users, UserPlus, MessageCircle, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const FriendsSection = ({ navigate }) => {
  const [friends, setFriends] = useState([
    { 
      id: '1', 
      name: 'Sarah Chen', 
      avatar: 'SC', 
      mutualFriends: 12, 
      status: 'friend',
      interests: ['Photography', 'Cooking']
    },
    { 
      id: '2', 
      name: 'Mike Rodriguez', 
      avatar: 'MR', 
      mutualFriends: 8, 
      status: 'friend',
      interests: ['Sports', 'Music']
    },
    { 
      id: '3', 
      name: 'Emma Thompson', 
      avatar: 'ET', 
      mutualFriends: 15, 
      status: 'friend',
      interests: ['Reading', 'Yoga']
    },
    { 
      id: '4', 
      name: 'Alex Kim', 
      avatar: 'AK', 
      mutualFriends: 6, 
      status: 'suggested',
      interests: ['Tech', 'Gaming']
    },
    { 
      id: '5', 
      name: 'Lisa Park', 
      avatar: 'LP', 
      mutualFriends: 10, 
      status: 'suggested',
      interests: ['Art', 'Travel']
    },
  ]);

  const currentFriends = friends.filter(f => f.status === 'friend');
  const suggestedFriends = friends.filter(f => f.status === 'suggested');

  const handleAddFriend = (friendId) => {
    setFriends(prev => prev.map(f => 
      f.id === friendId ? { ...f, status: 'friend' } : f
    ));
  };

  return (
    <div className="space-y-6">
      {/* My Friends */}
      <Card className="border-none shadow-card bg-card/70 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              My Friends ({currentFriends.length})
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('friends')}
              className="text-primary hover:bg-primary-light"
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentFriends.map((friend) => (
            <div 
              key={friend.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                    {friend.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-card-foreground">{friend.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{friend.mutualFriends} mutual friends</span>
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/chat')}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Suggested Friends */}
      <Card className="border-none shadow-card bg-card/70 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Suggested Friends
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('suggestions')}
              className="text-primary hover:bg-primary-light"
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedFriends.map((friend) => (
            <div 
              key={friend.id} 
              className="p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                      {friend.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-card-foreground">{friend.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{friend.mutualFriends} mutual friends</span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleAddFriend(friend.id)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 ml-13">
                {friend.interests.map((interest, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendsSection;