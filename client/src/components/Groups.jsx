/**
 * pages/Groups.jsx  (improved UI)
 *
 * Changes:
 *  - Header: title left-aligned, two buttons top-right (Create Group + Create Event)
 *  - Group cards: full cover image, rich hover effect with scale + shadow + ring
 *  - My Groups section: horizontal scroll strip of compact cards
 *  - Discover grid: 3-col on large, 2-col on md, 1-col on sm
 *  - Category chips: pill style with active indicator underline
 *  - Empty and loading states improved
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast }    from '../hooks/use-toast';
import { useAuth }     from '../hooks/useAuth';
import { groupsAPI }   from '../services/api';
import {
  Search, Plus, Users, MapPin,
  CalendarPlus, Loader2, ArrowRight,
} from 'lucide-react';
import { Button }  from '../components/ui/button';
import { Badge }   from '../components/ui/badge';
import { Input }   from '../components/ui/input';
import { useNavigate } from 'react-router-dom';

// ── category config ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',        label: 'All',        icon: '🌟', color: 'bg-slate-100   text-slate-700'  },
  { id: 'social',     label: 'Social',     icon: '☕', color: 'bg-amber-100  text-amber-700'  },
  { id: 'sports',     label: 'Sports',     icon: '⚽', color: 'bg-green-100  text-green-700'  },
  { id: 'arts',       label: 'Arts',       icon: '🎨', color: 'bg-purple-100 text-purple-700' },
  { id: 'technology', label: 'Technology', icon: '💻', color: 'bg-blue-100   text-blue-700'   },
  { id: 'food',       label: 'Food',       icon: '🍕', color: 'bg-orange-100 text-orange-700' },
  { id: 'music',      label: 'Music',      icon: '🎵', color: 'bg-pink-100   text-pink-700'   },
  { id: 'travel',     label: 'Travel',     icon: '✈️', color: 'bg-cyan-100   text-cyan-700'   },
  { id: 'fitness',    label: 'Fitness',    icon: '💪', color: 'bg-red-100    text-red-700'    },
  { id: 'gaming',     label: 'Gaming',     icon: '🎮', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'other',      label: 'Other',      icon: '👥', color: 'bg-gray-100   text-gray-700'   },
];

function getCatConf(category) {
  return CATEGORIES.find((c) => c.id === category?.toLowerCase()) || CATEGORIES[CATEGORIES.length - 1];
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop';

// ── My-Groups compact card ─────────────────────────────────────────────────────
function MyGroupChip({ group, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3
                 hover:border-primary/40 hover:shadow-md hover:bg-accent/30 transition-all duration-200 text-left group"
    >
      <img
        src={group.image || FALLBACK_IMG}
        alt={group.name}
        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
      />
      <div className="min-w-0">
        <p className="font-semibold text-sm text-foreground truncate max-w-[140px]">{group.name}</p>
        <p className="text-xs text-muted-foreground">{group.memberCount} members</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
}

// ── Main Group Card ────────────────────────────────────────────────────────────
function GroupCard({ group, isMember, onView, onJoin, onLeave, user }) {
  const cat = getCatConf(group.category);

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col
                 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30
                 transition-all duration-250 group cursor-pointer"
      onClick={onView}
    >
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden bg-muted">
        <img
          src={group.image || FALLBACK_IMG}
          alt={group.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Category pill over image */}
        <span className={`absolute top-3 left-3 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm bg-white/80 border border-white/40 shadow-sm ${cat.color}`}>
          <span>{cat.icon}</span>
          <span className="capitalize">{group.category}</span>
        </span>

        {/* Joined badge */}
        {isMember && (
          <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow">
            ✓ Joined
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Title + meta */}
        <div>
          <h3 className="font-bold text-base text-foreground leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-1">
            {group.name}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {group.memberCount} members
            </span>
            {group.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{group.location}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 text-xs font-medium hover:bg-accent"
            onClick={(e) => { e.stopPropagation(); onView(); }}
          >
            View Details
          </Button>
          <Button
            size="sm"
            className={`flex-1 h-9 text-xs font-medium transition-colors ${
              isMember
                ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              isMember ? onLeave() : onJoin();
            }}
          >
            {isMember ? 'Leave' : user ? 'Join' : 'Sign in'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchTerm,        setSearchTerm]        = useState('');
  const [selectedCategory,  setSelectedCategory]  = useState('all');
  const [groups,            setGroups]            = useState([]);
  const [userGroups,        setUserGroups]        = useState([]);
  const [loading,           setLoading]           = useState(true);

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search  : searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      };
      const res = await groupsAPI.getGroups(params);
      setGroups(res.data || []);
    } catch (err) {
      toast({ title: 'Failed to load groups', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  const fetchUserGroups = useCallback(async () => {
    try {
      const res = await groupsAPI.getUserGroups();
      setUserGroups(res.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchGroups();
    if (user) fetchUserGroups();
  }, [fetchGroups, user]);

  // ── join / leave ─────────────────────────────────────────────────────────
  const handleJoin = async (groupId) => {
    if (!user) { navigate('/auth'); return; }
    try {
      await groupsAPI.joinGroup(groupId);
      toast({ title: '🎉 Joined group successfully!' });
      fetchGroups(); fetchUserGroups();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to join', variant: 'destructive' });
    }
  };

  const handleLeave = async (groupId) => {
    try {
      await groupsAPI.leaveGroup(groupId);
      toast({ title: 'Left group.' });
      fetchGroups(); fetchUserGroups();
    } catch (err) {
      toast({ title: 'Failed to leave group', variant: 'destructive' });
    }
  };

  const isUserMember = (groupId) => userGroups.some((g) => g._id === groupId);
  const joinedGroups = groups.filter((g) => isUserMember(g._id));

  return (
    <div className="w-full px-4 py-8 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8">
        {/* Left: title flush left */}
        <div className="text-left">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Groups</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {user
              ? `Active in ${joinedGroups.length} group${joinedGroups.length !== 1 ? 's' : ''} · Discover more communities`
              : 'Discover and join communities around your interests'}
          </p>
        </div>

        {/* Right: two CTA buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            className="gap-2 h-9 text-sm border-border hover:bg-accent"
            onClick={() => user ? navigate('/events') : navigate('/auth')}
          >
            <CalendarPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Event</span>
            <span className="sm:hidden">Event</span>
          </Button>
          <Button
            className="gap-2 h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            onClick={() => user ? navigate('/create-group') : navigate('/auth')}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Group</span>
            <span className="sm:hidden">Group</span>
          </Button>
        </div>
      </div>

      {/* ── My Groups horizontal strip ── */}
      {user && joinedGroups.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> My Groups
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {joinedGroups.map((g) => (
              <MyGroupChip
                key={g._id}
                group={g}
                onClick={() => navigate(`/group-details/${g._id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Search bar ── */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search communities by name or description…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 bg-card border-border rounded-xl text-sm"
        />
      </div>

      {/* ── Category chips ── */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium
                        border transition-all duration-150 whitespace-nowrap
                        ${selectedCategory === cat.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-accent'
                        }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ── Discover heading ── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          {selectedCategory === 'all'
            ? 'All Communities'
            : `${getCatConf(selectedCategory).icon} ${getCatConf(selectedCategory).label} Communities`}
          {!loading && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({groups.length})
            </span>
          )}
        </h2>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <Search className="h-9 w-9 opacity-40" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground text-lg">No communities found</p>
            <p className="text-sm mt-1">Try a different category or search term</p>
          </div>
          <Button
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
            variant="outline"
            size="sm"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => (
            <GroupCard
              key={group._id}
              group={group}
              isMember={isUserMember(group._id)}
              user={user}
              onView={() => navigate(`/group-details/${group._id}`)}
              onJoin={() => handleJoin(group._id)}
              onLeave={() => handleLeave(group._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}