import React, { useState } from 'react';
import { ArrowLeft, Send, Phone, Video, Search, Smile, Mic } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import Navigation from '../components/Navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

const ChatPage = ({ navigate, user }) => {
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! How was the yoga session today?", self: false, time: "10:30", status: "delivered" },
    { id: 2, text: "It was amazing! We should go together next time", self: true, time: "10:32", status: "read" }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const emojis = ['😊', '👍', '❤️', '😂', '🎉', '🔥', '👏', '✨'];

  const friends = [
    { id: 1, name: "Sarah Chen", online: true, lastMessage: "Hey! How was the yoga session today?", status: "read", avatar: "SC" },
    { id: 2, name: "Mike Rodriguez", online: false, lastMessage: "See you at book club tomorrow", status: "delivered", avatar: "MR" },
    { id: 3, name: "Emma Thompson", online: true, lastMessage: "Thanks for the coffee recommendation!", status: "sent", avatar: "ET" },
    { id: 4, name: "Alex Kim", online: true, lastMessage: "Let's plan the next hiking trip", status: "read", avatar: "AK" }
  ];

  const sendMessage = (text) => {
    if (!text || !text.trim()) return;
    const newMsg = {
      id: Date.now(),
      text: text,
      self: true,
      time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}),
      status: "sent"
    };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-160px)] flex">
        {/* Sidebar */}
        <div className="w-80 bg-card/80 backdrop-blur-sm shadow-soft border-r border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-10 border-border"
              />
            </div>
          </div>

          <div className="p-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => setActiveFriend(friend)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2 transition-all ${
                  activeFriend?.id === friend.id 
                    ? "bg-primary-light border border-primary/20" 
                    : "hover:bg-accent"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                      {friend.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-card rounded-full ${
                    friend.online ? "bg-success" : "bg-muted-foreground"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-card-foreground">{friend.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{friend.lastMessage}</div>
                </div>
                {friend.status === 'sent' && (
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeFriend ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-card/80 backdrop-blur-sm border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                        {activeFriend.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-card-foreground">{activeFriend.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {activeFriend.online ? 'Active now' : 'Last seen recently'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="ghost"
                      size="icon"
                      className="text-success hover:bg-success/10"
                    >
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:bg-primary/10"
                    >
                      <Video className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-accent/20">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={`flex ${m.self ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-soft ${
                          m.self 
                            ? "bg-gradient-primary text-primary-foreground" 
                            : "bg-card text-card-foreground border border-border"
                        }`}
                      >
                        <div>{m.text}</div>
                        <div className="text-xs mt-1 opacity-70">{m.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 bg-card/80 backdrop-blur-sm border-t border-border">
                <div className="flex gap-2 items-center max-w-4xl mx-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="grid grid-cols-4 gap-2">
                        {emojis.map((emoji, i) => (
                          <Button
                            key={i}
                            variant="ghost"
                            className="text-2xl h-10"
                            onClick={() => setInput(prev => prev + emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Input
                    type="text"
                    placeholder={`Message ${activeFriend.name}...`}
                    className="flex-1 border-border"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  />
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsRecording(!isRecording)}
                    className={isRecording ? "text-destructive" : ""}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                  
                  <Button 
                    onClick={() => sendMessage(input)} 
                    className="bg-gradient-primary hover:bg-primary-hover"
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {isRecording && (
                  <div className="text-center text-sm text-destructive mt-2">
                    Recording... Click mic to stop
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Start a Conversation</h3>
                <p className="text-muted-foreground">
                  Select a contact to start chatting with your community friends
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default ChatPage;