import { useEffect, useState } from "react";
import { Users, Calendar, Activity, Heart, MessageCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Navigation from "../components/Navigation";
import FriendsSection from "../components/FriendsSection";
import UpcomingEvents from "../components/UpcomingEvents";
import { useAuth } from "../hooks/useAuth";
import { dashboardAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    groupsJoined: 0,
    activitiesParticipated: 0,
    communityFriends: 0,
    eventsScheduled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchStats = async () => {
      try {
        const { stats } = await dashboardAPI.getStats();
        setStats(stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast({
          title: "Error loading dashboard",
          description: "Could not load your stats",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate, toast]);

  const statsData = [
    {
      label: "Active Groups",
      value: stats.groupsJoined,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Activities Joined",
      value: stats.activitiesParticipated,
      icon: Activity,
      color: "text-success",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Community Friends",
      value: stats.communityFriends,
      icon: Heart,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      label: "Events Scheduled",
      value: stats.eventsScheduled,
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {user?.username || user?.email?.split("@")[0] || "User"}! 👋
              </h1>
              <p className="text-muted-foreground mt-2">
                Here's what's happening in your community today
              </p>
            </div>
            <Button
              onClick={() => navigate("/groups")}
              className="bg-gradient-to-r from-primary to-blue-600 hover:opacity-90"
            >
              Explore Groups
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statsData.map((stat, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {loading ? "..." : stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <UpcomingEvents />

        {/* Friends Section */}
        <FriendsSection />

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate("/feed")}
                variant="outline"
                className="w-full justify-start"
              >
                <MessageCircle className="h-4 w-4 mr-3" />
                Share an Update
              </Button>
              <Button
                onClick={() => navigate("/messages")}
                variant="outline"
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-3" />
                Community Chat
              </Button>
              <Button
                onClick={() => navigate("/groups")}
                variant="outline"
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-3" />
                Find New Groups
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
