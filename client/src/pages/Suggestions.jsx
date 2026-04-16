import { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

const Suggestions = ({ navigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([
    { 
      id: '1', 
      name: 'Alex Kim', 
      avatar: 'AK', 
      mutualFriends: 6,
      interests: ['Tech', 'Gaming']
    },
    { 
      id: '2', 
      name: 'Lisa Park', 
      avatar: 'LP', 
      mutualFriends: 10,
      interests: ['Art', 'Travel']
    },
    { 
      id: '3', 
      name: 'John Davis', 
      avatar: 'JD', 
      mutualFriends: 8,
      interests: ['Music', 'Photography']
    },
    { 
      id: '4', 
      name: 'Maria Garcia', 
      avatar: 'MG', 
      mutualFriends: 12,
      interests: ['Cooking', 'Yoga']
    },
    { 
      id: '5', 
      name: 'Tom Anderson', 
      avatar: 'TA', 
      mutualFriends: 7,
      interests: ['Sports', 'Reading']
    },
    { 
      id: '6', 
      name: 'Nina Patel', 
      avatar: 'NP', 
      mutualFriends: 9,
      interests: ['Tech', 'Art']
    },
  ]);

  const handleAddFriend = (friendId) => {
    setSuggestions(prev => prev.filter(s => s.id !== friendId));
  };

  const filteredSuggestions = suggestions.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-none shadow-card bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl font-bold text-card-foreground flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              Suggested Friends ({suggestions.length})
            </CardTitle>
          </div>
          <Input
            placeholder="Search suggestions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuggestions.map((person) => (
              <Card key={person.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                        {person.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-card-foreground">{person.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{person.mutualFriends} mutual friends</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {person.interests.map((interest, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleAddFriend(person.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friend
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

export default Suggestions;