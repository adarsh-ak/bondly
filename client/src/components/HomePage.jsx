import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Users, Heart, MessageCircle, TrendingUp, Star, MapPin, Calendar, Clock, ArrowRight } from "lucide-react";
import communityHero from "../assets/community-hero.jpg";
// import dailyServices from "../assets/daily-services.jpg";

const HomePage = ({ navigate, user }) => {
  const stats = [
    { label: "Active Groups", value: "500+", icon: Users },
    { label: "Community Members", value: "10K+", icon: Heart },
    { label: "Daily Posts", value: "200+", icon: MessageCircle },
    { label: "Success Stories", value: "1K+", icon: TrendingUp },
  ];

  const highlights = [
    {
      icon: "📸",
      title: "Photography Walk",
      time: "2 hours ago",
      location: "Central Park",
      participants: 12,
    },
    {
      icon: "🏀",
      title: "Basketball Game",
      time: "4 hours ago", 
      location: "Sports Complex",
      participants: 8,
    },
    {
      icon: "👨‍🍳",
      title: "Cooking Class",
      time: "6 hours ago",
      location: "Community Center", 
      participants: 15,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="text-sm">
                  🌟 Join thousands of community members
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                  Connect & Bond with Your{" "}
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Community
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Discover groups, share interests, and find everything you need in your local community. 
                  From hobbies to housing, we bring people together.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate("feed")} className="group">
                  Explore Community Feed
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("groups")}>
                  Browse Groups
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>50K+ Members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>4.9/5 Rating</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>1000+ Groups</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={communityHero} 
                alt="Community connecting through shared interests" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -bottom-6 -left-6 bg-background border rounded-lg p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary"></div>
                    <div className="w-8 h-8 rounded-full bg-blue-500"></div>
                    <div className="w-8 h-8 rounded-full bg-green-500"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Community</p>
                    <p className="text-xs text-muted-foreground">Join the conversation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted rounded-lg mb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <stat.icon className="h-8 w-8 mx-auto text-primary" />
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity Highlights */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Community Highlights</h2>
          <Button variant="outline" onClick={() => navigate("dashboard")}>
            View All Activity
          </Button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{highlight.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{highlight.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{highlight.time}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {highlight.location}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {highlight.participants} participants
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      {!user && (
        <section className="text-center py-12 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Start connecting with your community today. Share your interests, find local services, 
            and make meaningful connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("auth")}>
              Sign Up Now
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("feed")}>
              Explore First
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;