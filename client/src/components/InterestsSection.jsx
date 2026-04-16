import { useState, useEffect } from 'react';
// import { supabase } from '../intergrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const InterestsSection = () => {
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterestsData();
  }, []);

  const fetchInterestsData = async () => {
    try {
      // Fetch interest categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'interests');

      if (categoriesError) throw categoriesError;

      // Fetch groups for interest categories
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('category_id', categoriesData?.map(c => c.id) || [])
        .limit(6);

      if (groupsError) throw groupsError;

      setCategories(categoriesData || []);
      setGroups(groupsData || []);
    } catch (error) {
      console.error('Error fetching interests data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id });

      if (memberError) throw memberError;

      const { data: group } = await supabase
        .from('groups')
        .select('member_count')
        .eq('id', groupId)
        .single();
      
      if (group) {
        await supabase
          .from('groups')
          .update({ member_count: (group.member_count || 0) + 1 })
          .eq('id', groupId);
      }

      navigate('/groups');
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleCreateGroup = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate('/groups?create=true');
  };

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

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Discover Your Interests</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with like-minded people who share your hobbies and passions. 
          Join communities around photography, cooking, sports, and more.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
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
                  .filter(group => group.category_id === category.id)
                  .slice(0, 2)
                  .map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.member_count} members
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleJoinGroup(group.id)}
                        variant={user ? "default" : "outline"}
                      >
                        {user ? 'Join' : 'Sign in to Join'}
                      </Button>
                    </div>
                  ))}
                {user && (
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
                )}
                {!user && (
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

      {!user && (
        <div className="text-center bg-muted p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Ready to explore your interests?</h3>
          <p className="text-muted-foreground mb-4">
            Join our community to discover groups, connect with people, and pursue your passions.
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