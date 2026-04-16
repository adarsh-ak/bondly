import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Facebook, Twitter, Instagram, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-background border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Bondly</h3>
            <p className="text-muted-foreground">
              Connect with your community and find everything you need, from interests to daily necessities.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="/events" className="text-muted-foreground hover:text-foreground transition-colors">Events</a></li>
              <li><a href="/groups" className="text-muted-foreground hover:text-foreground transition-colors">Groups</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Categories</h4>
            <ul className="space-y-2">
              <li><a href="/groups?category=housing" className="text-muted-foreground hover:text-foreground transition-colors">Housing</a></li>
              <li><a href="/groups?category=education" className="text-muted-foreground hover:text-foreground transition-colors">Education</a></li>
              <li><a href="/groups?category=interests" className="text-muted-foreground hover:text-foreground transition-colors">Interests & Hobbies</a></li>
              <li><a href="/groups?category=services" className="text-muted-foreground hover:text-foreground transition-colors">Local Services</a></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Stay Connected</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>hello@bondly.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Subscribe to our newsletter</p>
              <div className="flex space-x-2">
                <Input placeholder="Enter your email" className="flex-1" />
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          </div>
        </div>


        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Bondly. All rights reserved. | <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a> | <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;