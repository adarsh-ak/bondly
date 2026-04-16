import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Users, Heart, MessageCircle, TrendingUp, Star, MapPin, Calendar, Clock, ArrowRight, Camera, BookOpen, Car, Home as HomeIcon, GraduationCap, Wrench } from "lucide-react";
import communityHero from "../assets/community-hero.jpg";
// import dailyServices from "../assets/daily-services.jpg";
import GroupCard from "../components/GroupCard";
import UpcomingEvents from "../components/UpcomingEvents";

const EnhancedHomePage = ({ navigate, user }) => {
  const interestGroups = [
    {
      id: 1,
      name: "Photography Club",
      description: "Capture moments and share your creative vision with fellow photography enthusiasts",
      image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop",
      members: 2500,
      category: "Photography",
      nextEvent: "Tomorrow, 10 AM",
      location: "Central Park"
    },
    {
      id: 2,
      name: "Book Lovers Society",
      description: "Monthly book discussions and literary events for passionate readers",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      members: 1800,
      category: "Books",
      nextEvent: "This Friday, 7 PM",
      location: "Downtown Library"
    },
    {
      id: 3,
      name: "Sports & Fitness",
      description: "Join group workouts, sports events, and stay active together",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop",
      members: 3200,
      category: "Sports",
      nextEvent: "Wed, 6 PM",
      location: "Sports Complex"
    }
  ];

  const necessityGroups = [
    {
      id: 4,
      name: "Housing Help",
      description: "Find apartments, roommates, and housing advice from your community",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
      members: 450,
      category: "Housing",
      location: "Citywide"
    },
    {
      id: 5,
      name: "Tutoring Network",
      description: "Connect with tutors and study groups for all subjects and levels",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
      members: 320,
      category: "Education",
      location: "Various Locations"
    },
    {
      id: 6,
      name: "Local Services",
      description: "Trusted recommendations for handymen, cleaners, and home services",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
      members: 190,
      category: "Services",
      location: "Local Area"
    }
  ];

  const features = [
    {
      icon: Users,
      title: "Interest Groups",
      description: "Join communities around your hobbies and passions",
      examples: ["Photography", "Cooking", "Sports", "Music"],
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: HomeIcon,
      title: "Daily Necessities",
      description: "Find essential services and local connections",
      examples: ["Housing", "Tutoring", "Transportation", "Services"],
      color: "bg-green-50 text-green-600",
    },
    {
      icon: MessageCircle,
      title: "Community Chat",
      description: "Connect with neighbors and like-minded people",
      examples: ["Group Messages", "Direct Chat", "Local Events"],
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const stats = [
    { label: "Active Communities", value: "1,200+", icon: Users },
    { label: "Happy Members", value: "50,000+", icon: Heart },
    { label: "Daily Connections", value: "10,000+", icon: MessageCircle },
    { label: "Success Stories", value: "25,000+", icon: TrendingUp },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Photography Enthusiast",
      content: "Found amazing photography groups and learned so much from fellow enthusiasts!",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Student",
      content: "Finally found a great tutor for calculus through the community. Life-changing!",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "New Resident",
      content: "Moving to a new city was scary, but this community helped me find housing and friends.",
      rating: 5,
    },
  ];

  return (
    <div className="space-y-20">
      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Everything You Need in One Place</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Whether you're pursuing hobbies or handling daily needs, our community has you covered.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {feature.examples.map((example, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      if (feature.title === 'Interest Groups') navigate('groups');
                      else if (feature.title === 'Daily Necessities') navigate('groups');
                      else if (feature.title === 'Community Chat') navigate('groups');
                    }}
                  >
                    Explore {feature.title}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discover Your Interests Section */}
      <section className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="text-lg">🎨 Pursue Your Passions</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Discover Your Interests</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with like-minded people who share your hobbies and passions. From photography and cooking to sports and music.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {interestGroups.map((group) => (
            <GroupCard
              key={group.id}
              {...group}
              onJoin={() => user ? navigate(`group-details/${group.id}`) : navigate('auth')}
              onViewDetails={() => navigate(`group-details/${group.id}`)}
              user={user}
            />
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <UpcomingEvents navigate={navigate} />

      {/* Daily Necessities Section */}
      <section className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="text-lg">🏠 Daily Essentials</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Daily Necessities</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Find everything you need for daily life. From housing and tutoring to transportation and local services.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {necessityGroups.map((group) => (
            <GroupCard
              key={group.id}
              {...group}
              onJoin={() => user ? navigate(`group-details/${group.id}`) : navigate('auth')}
              onViewDetails={() => navigate(`group-details/${group.id}`)}
              user={user}
            />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">What Our Community Says</h2>
            <p className="text-xl text-muted-foreground">
              Real stories from real people who found what they were looking for.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Join Our Community?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Start connecting with people who share your interests and find everything you need in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => navigate("auth")}>
                Join Community Today
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
                Learn More
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default EnhancedHomePage;