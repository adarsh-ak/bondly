/**
 * components/Navigation.jsx  (resized)
 *
 * Same fixes as before, but sized back up to a comfortable, readable scale:
 *  - Logo and nav text back to normal size
 *  - Nav items spaced properly without colliding into the logo, achieved by
 *    letting the link row scroll horizontally on smaller screens instead of
 *    forcing everything to shrink
 *  - Avatar back to standard size, username text intentionally still
 *    removed (so sign-out always stays visible), but everything else is
 *    full-size and easy to click/read
 */

import {
  Search, MessageCircle, Users, Home,
  LayoutDashboard, LogOut, Info,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const publicNavItems = [
  { id: "home",   label: "Home",     icon: Home },
  { id: "feed",   label: "Feed",     icon: MessageCircle },
  { id: "groups", label: "Groups",   icon: Users },
  { id: "about",  label: "About Us", icon: Info },
];

const authNavItems = [
  { id: "home",      label: "Home",      icon: Home },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "feed",      label: "Feed",      icon: MessageCircle },
  { id: "groups",    label: "Groups",    icon: Users },
  { id: "messages",  label: "Messages",  icon: MessageCircle },
  { id: "about",     label: "About Us",  icon: Info },
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
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-16">

          {/* Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div
              className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0"
              onClick={() => navigate("/")}
            >
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1
              className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent cursor-pointer whitespace-nowrap"
              onClick={() => navigate("/")}
            >
              Bondly
            </h1>
          </div>

          {/* Navigation Links — scrolls horizontally if it ever runs out of room,
              instead of shrinking text/icons down */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 px-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "secondary" : "ghost"}
                size="sm"
                className="text-sm whitespace-nowrap flex-shrink-0"
                onClick={() => navigate(`/${item.id === "home" ? "" : item.id}`)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Search and User */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <form onSubmit={handleSearch} className="hidden lg:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search communities..."
                className="pl-10 w-56"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* User section — avatar only (no name) so sign-out always stays visible */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/profile")}
                  title={user.username || user.email}
                  className="flex-shrink-0"
                >
                  <Avatar className="h-9 w-9 hover:ring-2 hover:ring-primary/40 transition-all">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                      {user.username?.charAt(0).toUpperCase() ||
                        user.email?.charAt(0).toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={signOut}
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0">
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
    </header>
  );
};

export default Navigation;