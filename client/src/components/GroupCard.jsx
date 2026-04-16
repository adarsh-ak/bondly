import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Users, MapPin, Calendar } from "lucide-react";

const GroupCard = ({ 
  name, 
  description, 
  image, 
  members, 
  category, 
  nextEvent, 
  location,
  onJoin, 
  onViewDetails,
  user 
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-none shadow-card">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <Badge className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm">
          {category}
        </Badge>
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{members} members</span>
          </div>
          {location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          )}
        </div>
        
        {nextEvent && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Next: {nextEvent}</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={onViewDetails}
            variant="outline"
            className="flex-1"
          >
            View Details
          </Button>
          <Button 
            onClick={onJoin}
            className="flex-1"
          >
            {user ? 'Join Group' : 'Sign in to Join'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupCard;