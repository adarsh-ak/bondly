import { useState } from 'react';
import { Users, MessageCircle, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const Friends = ({ navigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [friends] = useState([
    { 
      id: '1', 
      name: 'Sarah Chen', 
      avatar: 'SC', 
      mutualFriends: 12,
      interests: ['Photography', 'Cooking']
    },
    { 
      id: '2', 
      name: 'Mike Rodriguez', 
      avatar: 'MR', 
      mutualFriends: 8,
      interests: ['Sports', 'Music']
    },
    { 
      id: '3', 
      name: 'Emma Thompson', 
      avatar: 'ET', 
      mutualFriends: 15,
      interests: ['Reading', 'Yoga']
    },
    { 
      id: '4', 
      name: 'David Lee', 
      avatar: 'DL', 
      mutualFriends: 10,
      interests: ['Tech', 'Cooking']
    },
    { 
      id: '5', 
      name: 'Jessica Brown', 
      avatar: 'JB', 
      mutualFriends: 14,
      interests: ['Art', 'Music']
    },
    { 
      id: '6', 
      name: 'Chris Wilson', 
      avatar: 'CW', 
      mutualFriends: 9,
      interests: ['Gaming', 'Sports']
    },
  ]);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-none shadow-card bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl font-bold text-card-foreground flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              My Friends ({friends.length})
            </CardTitle>
          </div>
          <Input
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFriends.map((friend) => (
              <Card key={friend.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                        {friend.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-card-foreground">{friend.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{friend.mutualFriends} mutual friends</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {friend.interests.map((interest, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('chat')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Friends;