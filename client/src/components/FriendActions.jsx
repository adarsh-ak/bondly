// import { supabase } from '../intergrations/supabase/client';
import { useToast } from '../hooks/use-toast';

export const useFriendActions = () => {
  const { toast } = useToast();

  const unfriendUser = async (userId, friendId) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

      if (error) throw error;

      toast({ title: "Friend removed successfully" });
      return { success: true };
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({ title: "Failed to remove friend", variant: "destructive" });
      return { success: false };
    }
  };

  const addFriend = async (userId, friendId) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({ user_id: userId, friend_id: friendId, status: 'accepted' });

      if (error) throw error;

      // Remove from suggestions
      await supabase
        .from('friend_suggestions')
        .delete()
        .eq('user_id', userId)
        .eq('suggested_user_id', friendId);

      toast({ title: "Friend added successfully" });
      return { success: true };
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({ title: "Failed to add friend", variant: "destructive" });
      return { success: false };
    }
  };

  return { unfriendUser, addFriend };
};