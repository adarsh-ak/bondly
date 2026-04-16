import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const InterestsSection = () => {
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterestsData();
  }, []);

  // ================= FETCH DATA =================
  const fetchInterestsData = async () => {
    try {
      const categoriesData = await apiFetch('/api/categories?type=interests');
      const groupsData = await apiFetch('/api/groups?limit=6');

      setCategories(categoriesData.data || []);
      setGroups(groupsData.data || []);
    } catch (error) {
      console.error('Error fetching interests data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ================= JOIN GROUP =================
  const handleJoinGroup = async (groupId) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      await apiFetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
      });

      navigate('/groups');
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  // ================= CREATE GROUP =================
  const handleCreateGroup = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate('/groups?create=true');
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Discover Your Interests</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with like-minded people who share your hobbies and passions.
        </p>
      </div>

      {/* CATEGORIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {categories.map((category) => (
          <Card key={category._id} className="hover:shadow-lg transition-shadow">

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                {category.name}
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">

                {groups
                  .filter(group => group.category_id === category._id)
                  .slice(0, 2)
                  .map(group => (
                    <div
                      key={group._id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.member_count || 0} members
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleJoinGroup(group._id)}
                        variant={user ? "default" : "outline"}
                      >
                        {user ? 'Join' : 'Sign in'}
                      </Button>
                    </div>
                  ))
                }

                {/* CREATE GROUP */}
                {user ? (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCreateGroup}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Group
                    </Button>
                  </div>
                ) : (
                  <div className="text-center pt-2">
                    <Badge variant="secondary" className="text-xs">
                      Sign in to see more groups
                    </Badge>
                  </div>
                )}

              </div>
            </CardContent>

          </Card>
        ))}

      </div>

      {/* FOOTER CTA */}
      {!user && (
        <div className="text-center bg-muted p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            Ready to explore your interests?
          </h3>
          <p className="text-muted-foreground mb-4">
            Join our community to discover groups and connect with people.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Get Started Today
          </Button>
        </div>
      )}

    </div>
  );
};

export default InterestsSection;