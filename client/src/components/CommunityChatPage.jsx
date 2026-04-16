import React, { useState } from 'react';
import { Send, Users, Hash, Smile, Paperclip } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import Navigation from '../components/Navigation';

const CommunityChatPage = ({ navigate, user }) => {
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [message, setMessage] = useState('');
  
  const channels = [
    { id: 'general', name: 'general', description: 'General community discussion', members: 45 },
    { id: 'coffee-explorers', name: 'coffee-explorers', description: 'Weekend Coffee Explorers', members: 24 },
    { id: 'coding-chill', name: 'coding-chill', description: 'Coding & Chill Sessions', members: 18 },
    { id: 'book-club', name: 'book-club', description: 'Book Lovers Society', members: 15 },
  ];

  const messages = [
    {
      id: 1,
      user: { name: 'Sarah Chen', avatar: 'SC' },
      content: 'Good morning everyone! Who\'s joining the yoga session today?',
      time: '9:30 AM',
      channel: 'general'
    },
    {
      id: 2,
      user: { name: 'Mike Rodriguez', avatar: 'MR' },
      content: 'I\'ll be there! Looking forward to it 🧘‍♂️',
      time: '9:32 AM',
      channel: 'general'
    },
    {
      id: 3,
      user: { name: 'Emma Thompson', avatar: 'ET' },
      content: 'Has anyone tried the new coffee place on Main Street?',
      time: '10:15 AM',
      channel: 'coffee-explorers'
    },
    {
      id: 4,
      user: { name: 'Alex Kim', avatar: 'AK' },
      content: 'Yes! Their espresso is amazing. Perfect for our next meetup!',
      time: '10:17 AM',
      channel: 'coffee-explorers'
    }
  ];

  const onlineMembers = [
    { name: 'Sarah Chen', avatar: 'SC', status: 'online' },
    { name: 'Mike Rodriguez', avatar: 'MR', status: 'online' },
    { name: 'Emma Thompson', avatar: 'ET', status: 'away' },
    { name: 'Alex Kim', avatar: 'AK', status: 'online' },
    { name: 'Lisa Park', avatar: 'LP', status: 'online' }
  ];

  const currentChannel = channels.find(c => c.id === selectedChannel);
  const channelMessages = messages.filter(m => m.channel === selectedChannel);

  const sendMessage = () => {
    if (!message.trim()) return;
    // Handle sending message
    setMessage('');
  };

  return (
    <div className="h-[calc(100vh-160px)] flex">
        {/* Channels Sidebar */}
        <div className="w-64 bg-card/80 backdrop-blur-sm shadow-soft border-r border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Community Channels
            </h2>
          </div>

          <div className="p-4">
            <div className="space-y-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedChannel === channel.id
                      ? 'bg-primary-light text-primary border border-primary/20'
                      : 'hover:bg-accent text-card-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="h-4 w-4" />
                    <span className="font-medium">{channel.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {channel.members} members
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 bg-card/80 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  {currentChannel?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentChannel?.description} • {currentChannel?.members} members
                </p>
              </div>
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                {onlineMembers.filter(m => m.status === 'online').length} online
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-accent/10">
            <div className="space-y-4 max-w-4xl mx-auto">
              {channelMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                      {msg.user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-card-foreground">{msg.user.name}</span>
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-card-foreground">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 bg-card/80 backdrop-blur-sm border-t border-border">
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder={`Message #${currentChannel?.name}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="border-border pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button 
                onClick={sendMessage}
                className="bg-gradient-primary hover:bg-primary-hover"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Members Sidebar */}
        <div className="w-64 bg-card/80 backdrop-blur-sm shadow-soft border-l border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-card-foreground">Online Members</h3>
            <p className="text-sm text-muted-foreground">
              {onlineMembers.filter(m => m.status === 'online').length} of {onlineMembers.length}
            </p>
          </div>

          <div className="p-4">
            <div className="space-y-3">
              {onlineMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-semibold">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-card rounded-full ${
                      member.status === 'online' ? 'bg-success' : 'bg-warning'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-card-foreground text-sm">{member.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{member.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default CommunityChatPage;