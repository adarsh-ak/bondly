import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Users, Heart, Target, Sparkles, Mail, Phone, MapPin, Send } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const AboutUs = () => {
  const { toast } = useToast();
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    toast({
      title: 'Feedback Sent',
      description: 'Thank you for your feedback! We\'ll get back to you soon.'
    });
    setFeedbackForm({ name: '', email: '', subject: '', message: '' });
  };

  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "We believe in the power of bringing people together and creating meaningful connections."
    },
    {
      icon: Heart,
      title: "Authentic Connections",
      description: "Building genuine relationships through shared interests and mutual support."
    },
    {
      icon: Target,
      title: "Purpose-Driven",
      description: "Helping people find what they need, from hobbies to essential services, all in one place."
    },
    {
      icon: Sparkles,
      title: "Inclusive & Accessible",
      description: "Creating a welcoming space where everyone can discover their community."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-16">
        <h1 className="text-4xl md:text-5xl font-bold">About Bondly</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Bondly is more than just a platform—it's a movement to reconnect communities,
          one shared interest and meaningful connection at a time.
        </p>
      </div>

      {/* Mission Section */}
      <div className="mb-16">
        <Card className="border-none shadow-lg">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              We're building a platform where communities thrive, interests flourish, and daily needs are met
              through genuine human connection. Whether you're looking to explore a new hobby, find essential
              services, or simply connect with like-minded neighbors, Bondly brings people together.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              From photography enthusiasts and book clubs to housing help and tutoring services, we believe
              that strong communities are built on shared experiences and mutual support.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Values Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* What We Offer Section */}
      <div className="mb-16">
        <Card className="border-none shadow-lg bg-gradient-to-r from-primary/5 to-blue-600/5">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-8">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Interest-Based Communities
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Discover and join groups centered around your passions—whether it's photography,
                  cooking, sports, or any hobby that brings you joy.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Daily Necessities Support
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Find essential services like housing, tutoring, transportation, and local help
                  through trusted community connections.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Story Section */}
      <div className="text-center space-y-6 mb-16">
        <h2 className="text-3xl font-bold">Our Story</h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Bondly was born from the realization that modern life often leaves us disconnected from our
          communities. We created this platform to bridge that gap—making it easy to find your tribe,
          pursue your interests, and get the help you need, all while building meaningful relationships
          with the people around you.
        </p>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Today, thousands of people use Bondly to connect, grow, and thrive together. We're just getting
          started, and we're excited to have you join our community.
        </p>
      </div>

      {/* Contact Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Card className="border-none shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Email</p>
                  <a href="mailto:hello@bondly.com" className="text-primary hover:underline">
                    hello@bondly.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Phone</p>
                  <a href="tel:+1234567890" className="text-primary hover:underline">
                    +1 (234) 567-890
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-muted-foreground">
                    123 Community Street<br />
                    San Francisco, CA 94102
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Send Us Feedback</h2>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={feedbackForm.name}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={feedbackForm.email}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Feedback
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutUs;