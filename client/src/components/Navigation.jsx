import { Search, User, MessageCircle, Users, Home, LogOut } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const publicNavItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "feed", label: "Feed", icon: MessageCircle },
  { id: "groups", label: "Groups", icon: Users },
  { id: "about", label: "About Us", icon: Users },
];

const authNavItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "feed", label: "Feed", icon: MessageCircle },
  { id: "groups", label: "Groups", icon: Users },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "about", label: "About Us", icon: Users },
];

const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = user ? authNavItems : publicNavItems;
  const [searchQuery, setSearchQuery] = useState("");

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === "/") return "home";
    return path.substring(1);
  };

  const currentPage = getCurrentPage();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/groups?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1
              className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent cursor-pointer"
              onClick={() => navigate("/")}
            >
              Bondly
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "secondary" : "ghost"}
                size="sm"
                className="text-sm"
                onClick={() => navigate(`/${item.id === "home" ? "" : item.id}`)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Search and User */}
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="hidden lg:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search communities..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* User section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div
                    className="flex items-center space-x-3 cursor-pointer hover:bg-accent rounded-lg p-2 transition-colors"
                    onClick={() => navigate("/profile")}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                        {user.username?.charAt(0).toUpperCase() ||
                          user.email?.charAt(0).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">
                      {user.username || user.email?.split("@")[0]}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={signOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                  <Button size="sm" onClick={() => navigate("/auth")}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
