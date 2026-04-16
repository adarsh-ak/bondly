import React from 'react';
import { 
  Home, Car, GraduationCap, Wrench, ShoppingCart, 
  Heart, Building2, Utensils, Briefcase, Wifi
} from 'lucide-react';
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const NecessaryServicesSection = ({ navigate, user }) => {
  const necessaryServices = [
    {
      id: 1,
      category: 'Housing & Accommodation',
      icon: Home,
      color: 'bg-blue-100 text-blue-700',
      groups: [
        { name: 'Flatmate Finder Network', members: 156, description: 'Find verified flatmates and shared accommodations' },
        { name: 'Local Housing Support', members: 89, description: 'Tips for finding affordable housing in the area' },
        { name: 'Rental Help Community', members: 203, description: 'Navigate rental processes and tenant rights' }
      ]
    },
    {
      id: 2,
      category: 'Transportation',
      icon: Car,
      color: 'bg-green-100 text-green-700',
      groups: [
        { name: 'Carpooling Network', members: 124, description: 'Share rides and reduce commuting costs' },
        { name: 'Public Transport Tips', members: 67, description: 'Navigate local transport systems efficiently' },
        { name: 'Bike Community', members: 95, description: 'Cycling routes and bike maintenance help' }
      ]
    },
    {
      id: 3,
      category: 'Education & Tutoring',
      icon: GraduationCap,
      color: 'bg-purple-100 text-purple-700',
      groups: [
        { name: 'Language Exchange Hub', members: 178, description: 'Practice languages with native speakers' },
        { name: 'Study Groups Central', members: 145, description: 'Find study partners for various subjects' },
        { name: 'Professional Tutors', members: 89, description: 'Connect with qualified tutors and mentors' }
      ]
    },
    {
      id: 4,
      category: 'Services & Repairs',
      icon: Wrench,
      color: 'bg-orange-100 text-orange-700',
      groups: [
        { name: 'Handyman Network', members: 112, description: 'Trusted local service providers' },
        { name: 'Tech Support Community', members: 87, description: 'Get help with technology issues' },
        { name: 'DIY Repair Help', members: 156, description: 'Learn to fix things yourself' }
      ]
    },
    {
      id: 5,
      category: 'Shopping & Essentials',
      icon: ShoppingCart,
      color: 'bg-pink-100 text-pink-700',
      groups: [
        { name: 'Local Shopping Guide', members: 134, description: 'Best places for groceries and essentials' },
        { name: 'Bulk Buying Group', members: 78, description: 'Save money by buying in bulk together' },
        { name: 'Farmers Market Community', members: 92, description: 'Fresh local produce and vendors' }
      ]
    },
    {
      id: 6,
      category: 'Healthcare & Wellness',
      icon: Heart,
      color: 'bg-red-100 text-red-700',
      groups: [
        { name: 'Healthcare Navigator', members: 167, description: 'Find doctors, clinics, and health services' },
        { name: 'Wellness Support', members: 145, description: 'Mental health and wellness resources' },
        { name: 'Fitness Buddies', members: 189, description: 'Find workout partners and gym recommendations' }
      ]
    }
  ];

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">Essential Services for New Residents</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Moving to a new place? Connect with local communities that can help you settle in and find everything you need.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {necessaryServices.map((service) => (
          <Card key={service.id} className="border-none shadow-card bg-card/70 backdrop-blur-sm hover:shadow-soft transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.color} shadow-sm`}>
                  <service.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-card-foreground text-lg">{service.category}</h3>
                  <p className="text-sm text-muted-foreground">{service.groups.length} communities</p>
                </div>
              </div>

              <div className="space-y-3">
                {service.groups.map((group, index) => (
                  <div key={index} className="p-3 bg-accent/50 rounded-lg hover:bg-accent/70 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-card-foreground text-sm">{group.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {group.members}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => user ? navigate('/groups') : navigate('/auth')}
                className="w-full mt-4 bg-gradient-primary hover:bg-primary-hover"
                size="sm"
              >
                {user ? 'Explore Communities' : 'Sign in to Access'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <Card className="border-none shadow-card bg-gradient-primary/10 backdrop-blur-sm">
          <CardContent className="p-6">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Can't Find What You Need?</h3>
            <p className="text-muted-foreground mb-4">
              Create a community for the service or support you're looking for. Others in your area might need the same help!
            </p>
            <Button 
              onClick={() => user ? navigate('/create-group') : navigate('/auth')}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              Create Service Community
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NecessaryServicesSection;