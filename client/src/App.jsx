import { Toaster } from "../src/components/ui/toaster";
import { Toaster as Sonner } from "../src/components/ui/sonner";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../src/hooks/useAuth";
import Navigation from "../src/components/Navigation";
import HomePageComponent from "../src/components/HomePage";
import EnhancedHomePage from "../src/components/EnhancedHomePage";
import Footer from "../src/components/Footer";
import EnhancedFeed from "../src/components/EnhancedFeed";
import Groups from "../src/components/Groups";
import Dashboard from "../src/components/Dashboard";
import ProfilePage from "../src/components/ProfilePage";
import CreateGroup from "../src/components/CreateGroup";
import EnhancedGroupDetails from "../src/components/EnhancedGroupDetails";
import Auth from "./pages/Auth";
import CreatePost from "../src/components/CreatePost";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import Messages from "./pages/Messages";
import Events from "./pages/Event";

const queryClient = new QueryClient();

const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <main className="pt-16">{children}</main>
    <Footer />
  </div>
);

const MessagesLayout = ({ children }) => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navigation />
    <main className="flex-1 pt-16">{children}</main>
  </div>
);

const HomePageWrapper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="space-y-16">
      <HomePageComponent navigate={(page) => navigate(`/${page}`)} user={user} />
      <EnhancedHomePage navigate={(page) => navigate(`/${page}`)} user={user} />
    </div>
  );
};

const FeedWrapper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return <EnhancedFeed navigate={navigate} user={user} />;
};

const GroupsWrapper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return <Groups navigate={navigate} user={user} />;
};

const DashboardWrapper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return user ? <Dashboard navigate={(page) => navigate(`/${page}`)} user={user} /> : <HomePageComponent navigate={(page) => navigate(`/${page}`)} user={user} />;
};

const ProfileWrapper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return user ? (
    <ProfilePage 
      navigate={(page) => navigate(`/${page}`)} 
      user={user} 
      setUser={() => {}} 
      onLogout={() => {}} 
    />
  ) : <HomePageComponent navigate={(page) => navigate(`/${page}`)} user={user} />;
};

const CreateGroupWrapper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return <CreateGroup navigate={navigate} user={user} />;
};

const GroupDetailsWrapper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Extract groupId from URL params
  const groupId = window.location.pathname.split('/').pop();
  return <EnhancedGroupDetails navigate={navigate} groupId={groupId} user={user} />;
};

const MessagesWrapper = () => {
  return <Messages />;
};

const EventsWrapper = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return <Events navigate={(page) => navigate(`/${page}`)} user={user} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
          <Routes>
            <Route path="/" element={<AppLayout><HomePageWrapper /></AppLayout>} />
            <Route path="/feed" element={<AppLayout><FeedWrapper /></AppLayout>} />
            <Route path="/groups" element={<AppLayout><GroupsWrapper /></AppLayout>} />
            <Route path="/dashboard" element={<AppLayout><DashboardWrapper /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><ProfileWrapper /></AppLayout>} />
            <Route path="/create-group" element={<AppLayout><CreateGroupWrapper /></AppLayout>} />
            <Route path="/group-details/:id" element={<AppLayout><GroupDetailsWrapper /></AppLayout>} />
             

          <Route path="/create-post" element={<AppLayout><CreatePost /></AppLayout>} />

           
            <Route path="/messages" element={<MessagesLayout><MessagesWrapper /></MessagesLayout>} />
            <Route path="/events" element={<AppLayout><EventsWrapper /></AppLayout>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/about" element={<AppLayout><AboutUs /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        
      </TooltipProvider>
    </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;