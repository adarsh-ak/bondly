/**
 * Dashboard.jsx  (updated)
 *
 * Changes from previous version:
 *  - "Community Friends" stat card REMOVED
 *  - Only 3 stat cards: Active Groups, Activities Joined, Events Scheduled
 *  - Events list sorted most-recent-created at top (not by startDate)
 *  - Activities panel: join/leave event button + live attendee count
 *  - Activities panel PAST tab: full member list for each attendee
 *  - Activities panel: "ends on" text removed everywhere
 *  - Events Scheduled panel: full details — when it happened, who joined, count
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Users, Calendar, Activity,
  X, ArrowRight, MapPin, Clock,
  ChevronRight, AlertCircle, Loader2,
  UserCheck, UserPlus, Trophy,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";

// ─── fetch helper ─────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── date helpers ─────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "TBA";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bgColor, loading, delay = 0, onClick }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (loading || value === 0) { setDisplayed(0); return; }
    let start = 0;
    const step = Math.ceil(value / 20);
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        start = Math.min(start + step, value);
        setDisplayed(start);
        if (start >= value) clearInterval(iv);
      }, 40);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [loading, value, delay]);

  return (
    <Card
      onClick={onClick}
      className={`border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        onClick ? "cursor-pointer hover:ring-2 hover:ring-primary/30" : "cursor-default"
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {loading ? "…" : displayed}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        {onClick && (
          <p className="text-[10px] text-primary mt-2 flex items-center gap-0.5">
            Click to view <ChevronRight className="h-3 w-3" />
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Side Panel shell ─────────────────────────────────────────────────────────
function SidePanel({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  );
}

// ─── New Event Popup ──────────────────────────────────────────────────────────
function NewEventPopup({ event, onClose, onView }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <Badge className="bg-primary/10 text-primary text-xs">🎉 New Event</Badge>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <h4 className="font-semibold text-sm mb-1 line-clamp-1">{event.title}</h4>
      <p className="text-xs text-muted-foreground mb-1">
        {event.group?.name && <span className="font-medium">{event.group.name} · </span>}
        {fmtDate(event.startDate)}
      </p>
      {event.location && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
          <MapPin className="h-3 w-3" /> {event.location}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-7 text-xs" onClick={onView}>View Event</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onClose}>Dismiss</Button>
      </div>
    </div>
  );
}

// ─── Attendee List sub-component ──────────────────────────────────────────────
function AttendeeList({ attendees, showAll = false }) {
  const [expanded, setExpanded] = useState(showAll);
  const going = attendees?.filter((a) => a.status === "going") || [];
  const shown = expanded ? going : going.slice(0, 3);

  if (going.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No attendees yet.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-1">
        {shown.map((a, i) => {
          const name = a.user?.username || a.user?.fullName || "Member";
          const initials = name.charAt(0).toUpperCase();
          return (
            <div key={a.user?._id || i} className="flex items-center gap-1.5 bg-muted rounded-full px-2 py-0.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px] bg-primary/20 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium">{name}</span>
            </div>
          );
        })}
        {!expanded && going.length > 3 && (
          <button
            onClick={() => setExpanded(true)}
            className="text-[11px] text-primary underline"
          >
            +{going.length - 3} more
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Active Groups Panel ──────────────────────────────────────────────────────
function ActiveGroupsPanel({ onClose }) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [groupEvents, setGroupEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState(null);

  useEffect(() => {
    apiFetch("/api/groups/user/my-groups")
      .then((d) => setGroups(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadGroupEvents = useCallback(async (groupId) => {
    if (groupEvents[groupId]) return;
    try {
      const d = await apiFetch(`/api/events/group/${groupId}?status=all`);
      setGroupEvents((prev) => ({ ...prev, [groupId]: d.data || [] }));
    } catch {
      setGroupEvents((prev) => ({ ...prev, [groupId]: [] }));
    }
  }, [groupEvents]);

  const toggleGroup = (groupId) => {
    if (expandedGroup === groupId) { setExpandedGroup(null); return; }
    setExpandedGroup(groupId);
    loadGroupEvents(groupId);
  };

  if (loading) return (
    <SidePanel title="Active Groups" onClose={onClose}>
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </SidePanel>
  );

  return (
    <SidePanel title={`Active Groups (${groups.length})`} onClose={onClose}>
      {groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>You haven't joined any groups yet.</p>
          <Button size="sm" className="mt-4" onClick={() => { onClose(); navigate("/groups"); }}>
            Explore Groups
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group._id} className="border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
                onClick={() => toggleGroup(group._id)}
              >
                <img
                  src={group.image || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=80"}
                  alt={group.name}
                  className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.memberCount} members · {group.category}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/group-details/${group._id}`); }}>
                    Open
                  </Button>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedGroup === group._id ? "rotate-90" : ""}`} />
                </div>
              </button>

              {expandedGroup === group._id && (
                <div className="border-t bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Group Activity</p>
                  {!groupEvents[group._id] ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                    </div>
                  ) : groupEvents[group._id].length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No events in this group yet.</p>
                  ) : (
                    groupEvents[group._id].slice(0, 5).map((ev) => (
                      <div key={ev._id} className="flex items-start gap-2 p-2 rounded-lg bg-card border text-xs">
                        <div className="flex flex-col items-center bg-primary/10 rounded-md px-2 py-1 min-w-[42px]">
                          <span className="text-[10px] text-primary font-medium">
                            {new Date(ev.startDate).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-base font-bold text-primary leading-none">
                            {new Date(ev.startDate).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ev.title}</p>
                          <p className="text-muted-foreground">
                            {fmtTime(ev.startDate)}{ev.location ? ` · ${ev.location}` : ""}
                          </p>
                          <p className="text-muted-foreground">
                            {ev.attendees?.filter(a => a.status === "going").length || ev.attendeeCount || 0} attending
                          </p>
                          <Badge variant="secondary" className={`mt-1 text-[10px] h-4 ${
                            ev.status === "upcoming" ? "bg-green-100 text-green-700"
                            : ev.status === "ongoing" ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"}`}>
                            {ev.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs mt-1"
                    onClick={() => { onClose(); navigate(`/group-details/${group._id}`); }}>
                    See all events <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SidePanel>
  );
}

// ─── Activities Panel ─────────────────────────────────────────────────────────
function ActivitiesPanel({ onClose, currentUserId }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState("upcoming");

  const [upcoming, setUpcoming] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  const [past, setPast] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);
  const pastFetched = useRef(false);

  // ── fetch upcoming ──
  const fetchUpcoming = useCallback(async () => {
    setUpcomingLoading(true);
    try {
      const d = await apiFetch("/api/events/user/upcoming");
      const now = Date.now();
      const sorted = (d.data || [])
        .filter((e) => e.status !== 'cancelled' && new Date(e.startDate).getTime() > now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      setUpcoming(sorted);
    } catch (e) {
      toast({ title: "Could not load upcoming events", variant: "destructive" });
    } finally {
      setUpcomingLoading(false);
    }
  }, []);

  useEffect(() => { fetchUpcoming(); }, [fetchUpcoming]);

  // ── fetch past (only once) ──
  const fetchPast = useCallback(async () => {
    if (pastFetched.current) return;
    pastFetched.current = true;
    setPastLoading(true);
    try {
      // Get all groups first, then fetch completed events from those groups
      const gd = await apiFetch("/api/groups/user/my-groups");
      const groupIds = (gd.data || []).map((g) => g._id);
      if (groupIds.length === 0) { setPast([]); return; }

      // Fetch completed events with full attendee population
      const promises = groupIds.map((gid) =>
        apiFetch(`/api/events/group/${gid}?status=all`).catch(() => ({ data: [] }))
      );
      const results = await Promise.all(promises);
      const allEvents = results.flatMap((r) => r.data || []);

      // Keep only past events (startDate has passed OR cancelled), sort newest first
      const now = Date.now();
      const pastEvs = allEvents
        .filter((e) => new Date(e.startDate).getTime() <= now || e.status === 'cancelled')
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

      // Deduplicate by _id
      const seen = new Set();
      const deduped = pastEvs.filter((e) => { if (seen.has(e._id)) return false; seen.add(e._id); return true; });
      setPast(deduped);
    } catch {
      toast({ title: "Could not load past events", variant: "destructive" });
    } finally {
      setPastLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === "past") fetchPast(); }, [tab, fetchPast]);

  // ── join / leave event ──
  const handleJoin = async (eventId) => {
    try {
      await apiFetch(`/api/events/${eventId}/join`, { method: "POST", body: JSON.stringify({ status: "going" }) });
      toast({ title: "✅ You're now attending this event!" });
      fetchUpcoming();
    } catch (e) {
      toast({ title: e.message || "Could not join event", variant: "destructive" });
    }
  };

  const handleLeave = async (eventId) => {
    try {
      await apiFetch(`/api/events/${eventId}/leave`, { method: "POST" });
      toast({ title: "You've left this event." });
      fetchUpcoming();
    } catch (e) {
      toast({ title: e.message || "Could not leave event", variant: "destructive" });
    }
  };

  const isAttending = (ev) =>
    ev.attendees?.some((a) => a.user?._id === currentUserId || a.user === currentUserId);

  // ── render event card (upcoming) ──
  const UpcomingCard = ({ ev }) => {
    const going = ev.attendees?.filter((a) => a.status === "going") || [];
    const attending = isAttending(ev);

    return (
      <div className="border rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{ev.title}</h4>
            {ev.group?.name && (
              <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {ev.group.name}
              </span>
            )}
          </div>
          <Badge variant="secondary" className={`text-[10px] flex-shrink-0 ${
            ev.status === "upcoming" ? "bg-green-100 text-green-700"
            : ev.status === "ongoing" ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-600"}`}>
            {ev.status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(ev.startDate)}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(ev.startDate)}</span>
          {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
        </div>

        {/* Attendee count + join/leave */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{going.length}</span> attending
            {ev.maxAttendees && <span className="text-muted-foreground/60">/ {ev.maxAttendees} max</span>}
          </div>
          <Button
            size="sm"
            variant={attending ? "outline" : "default"}
            className={`h-7 text-xs ${attending ? "border-red-300 text-red-600 hover:bg-red-50" : ""}`}
            onClick={() => attending ? handleLeave(ev._id) : handleJoin(ev._id)}
          >
            {attending ? (
              <><UserCheck className="h-3 w-3 mr-1" />Leave</>
            ) : (
              <><UserPlus className="h-3 w-3 mr-1" />Join</>
            )}
          </Button>
        </div>

        {/* Attendee pills */}
        {going.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Who's going</p>
            <AttendeeList attendees={ev.attendees} />
          </div>
        )}

        {ev.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{ev.description}</p>
        )}

        {ev.eventType === "Virtual" && ev.virtualLink && (
          <a href={ev.virtualLink} target="_blank" rel="noopener noreferrer"
            className="text-xs text-primary underline">Join online →</a>
        )}
      </div>
    );
  };

  // ── render past event card ──
  const PastCard = ({ ev }) => {
    const [showMembers, setShowMembers] = useState(false);
    const going = ev.attendees?.filter((a) => a.status === "going") || [];

    return (
      <div className="border rounded-xl p-4 space-y-3 opacity-90">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{ev.title}</h4>
            {ev.group?.name && (
              <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {ev.group.name}
              </span>
            )}
          </div>
          <Badge variant="secondary" className="text-[10px] flex-shrink-0 bg-gray-100 text-gray-600">
            {ev.status}
          </Badge>
        </div>

        {/* Date & location — no "ends on" */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(ev.startDate)}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(ev.startDate)}</span>
          {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
        </div>

        {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}

        {/* Attendee summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{going.length}</span>
            <span className="text-muted-foreground">people attended</span>
          </div>
          {going.length > 0 && (
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="text-[11px] text-primary underline"
            >
              {showMembers ? "Hide" : "Show members"}
            </button>
          )}
        </div>

        {/* Full member list when expanded */}
        {showMembers && going.length > 0 && (
          <div className="bg-muted/40 rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Attendees ({going.length})
            </p>
            {going.map((a, i) => {
              const name = a.user?.username || a.user?.fullName || "Member";
              const initials = name.charAt(0).toUpperCase();
              return (
                <div key={a.user?._id || i} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-medium">{name}</p>
                    {a.user?.fullName && a.user?.fullName !== name && (
                      <p className="text-[10px] text-muted-foreground">{a.user.fullName}</p>
                    )}
                  </div>
                  {a.registeredAt && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      joined {new Date(a.registeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const isLoading = tab === "upcoming" ? upcomingLoading : pastLoading;
  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <SidePanel title="Activities" onClose={onClose}>
      <div className="flex gap-2 mb-5">
        {["upcoming", "past"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {tab === "upcoming" ? "No upcoming activities." : "No past events found."}
          </p>
          {tab === "upcoming" && (
            <Button size="sm" className="mt-4" onClick={() => { onClose(); navigate("/groups"); }}>
              Browse Groups
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((ev) =>
            tab === "upcoming"
              ? <UpcomingCard key={ev._id} ev={ev} />
              : <PastCard key={ev._id} ev={ev} />
          )}
        </div>
      )}
    </SidePanel>
  );
}

// ─── Events Scheduled Panel ───────────────────────────────────────────────────
function EventsScheduledPanel({ onClose, currentUserId }) {
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState(null);

  useEffect(() => {
    // Fetch events created by the current user
    apiFetch("/api/events?limit=50")
      .then((d) => {
        const mine = (d.data || []).filter(
          (e) => e.organizer?._id === currentUserId || e.organizer === currentUserId
        );
        // Most recent first by createdAt
        mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(mine);
      })
      .catch(() => toast({ title: "Could not load your events", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  return (
    <SidePanel title={`Events You Scheduled (${events.length})`} onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">You haven't scheduled any events yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const going = ev.attendees?.filter((a) => a.status === "going") || [];
            const isExpanded = expandedEvent === ev._id;

            return (
              <div key={ev._id} className="border rounded-xl overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full p-4 text-left hover:bg-accent/30 transition-colors"
                  onClick={() => setExpandedEvent(isExpanded ? null : ev._id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{ev.title}</h4>
                      {ev.group?.name && (
                        <span className="text-[11px] text-muted-foreground">{ev.group.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className={`text-[10px] ${
                        ev.status === "upcoming" ? "bg-green-100 text-green-700"
                        : ev.status === "ongoing" ? "bg-blue-100 text-blue-700"
                        : ev.status === "completed" ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"}`}>
                        {ev.status}
                      </Badge>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(ev.startDate)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(ev.startDate)}</span>
                    {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{going.length}</span>
                    <span className="text-muted-foreground">
                      {ev.maxAttendees ? `/ ${ev.maxAttendees} joined` : "joined"}
                    </span>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t bg-muted/20 p-4 space-y-4">
                    {ev.description && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                        <p className="text-xs text-foreground">{ev.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Event Type</p>
                        <p>{ev.eventType || "In-Person"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created</p>
                        <p>{fmtDate(ev.createdAt)}</p>
                      </div>
                      {ev.maxAttendees && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Capacity</p>
                          <p>{going.length} / {ev.maxAttendees}</p>
                        </div>
                      )}
                    </div>

                    {ev.eventType === "Virtual" && ev.virtualLink && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Virtual Link</p>
                        <a href={ev.virtualLink} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary underline break-all">{ev.virtualLink}</a>
                      </div>
                    )}

                    {/* Full attendee list */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        People who joined ({going.length})
                      </p>
                      {going.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No one has joined yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {going.map((a, i) => {
                            const name = a.user?.username || a.user?.fullName || "Member";
                            const fullName = a.user?.fullName;
                            const initials = name.charAt(0).toUpperCase();
                            return (
                              <div key={a.user?._id || i} className="flex items-center gap-2 p-2 bg-card rounded-lg border">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-[11px] bg-primary/20 text-primary">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{name}</p>
                                  {fullName && fullName !== name && (
                                    <p className="text-[10px] text-muted-foreground truncate">{fullName}</p>
                                  )}
                                </div>
                                {a.registeredAt && (
                                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                    {new Date(a.registeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SidePanel>
  );
}

// ─── Events List (dashboard body) ─────────────────────────────────────────────
function EventsList({ events, loading, error, onRetry, navigate, onJoin, onLeave, currentUserId }) {
  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
      <AlertCircle className="h-7 w-7 text-red-400" />
      <p className="text-sm text-center">{error}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>Try Again</Button>
    </div>
  );

  if (!events.length) return (
    <div className="text-center py-10 text-muted-foreground">
      <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm">No upcoming events from your groups.</p>
      <Button size="sm" className="mt-4" onClick={() => navigate("/groups")}>Explore Groups</Button>
    </div>
  );

  const isAttending = (ev) =>
    ev.attendees?.some((a) => a.user?._id === currentUserId || a.user === currentUserId);

  return (
    <div className="space-y-3">
      {events.map((ev) => {
        const going = ev.attendees?.filter((a) => a.status === "going") || [];
        const attending = isAttending(ev);

        return (
          <div key={ev._id} className="flex items-start gap-4 p-4 rounded-xl border hover:bg-accent/30 transition-colors">
            {/* date block */}
            <div className="flex flex-col items-center bg-primary/10 rounded-xl px-3 py-2 min-w-[52px] flex-shrink-0">
              <span className="text-[11px] font-medium text-primary uppercase">
                {new Date(ev.startDate).toLocaleDateString("en-US", { month: "short" })}
              </span>
              <span className="text-2xl font-bold text-primary leading-tight">
                {new Date(ev.startDate).getDate()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm truncate">{ev.title}</h4>
                <Badge variant="secondary" className={`text-[10px] flex-shrink-0 ${
                  ev.status === "upcoming" ? "bg-green-100 text-green-700"
                  : ev.status === "ongoing" ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"}`}>
                  {ev.status}
                </Badge>
              </div>

              {ev.group?.name && (
                <div className="flex">
                  <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {ev.group.name}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(ev.startDate)}</span>
                {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Users className="h-3 w-3 text-muted-foreground" />{going.length} attending
                  {ev.maxAttendees && <span className="font-normal text-muted-foreground">/ {ev.maxAttendees}</span>}
                </span>
              </div>
            </div>

            {/* Join / Leave */}
            <Button
              size="sm"
              variant={attending ? "outline" : "default"}
              className={`flex-shrink-0 h-8 text-xs ${attending ? "border-red-300 text-red-600 hover:bg-red-50" : ""}`}
              onClick={() => attending ? onLeave(ev._id) : onJoin(ev._id)}
            >
              {attending ? "Leave" : "Join"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState({ groupsJoined: 0, activitiesParticipated: 0, eventsScheduled: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  const [newEventPopup, setNewEventPopup] = useState(null);
  const popupShown = useRef(false);

  const [panel, setPanel] = useState(null); // "groups" | "activities" | "scheduled"

  // fetch stats
  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    apiFetch("/api/dashboard/stats")
      .then(({ stats: s }) => setStats({
        groupsJoined: s.groupsJoined,
        activitiesParticipated: s.activitiesParticipated,
        eventsScheduled: s.eventsScheduled,
      }))
      .catch(() => toast({ title: "Could not load stats", variant: "destructive" }))
      .finally(() => setStatsLoading(false));
  }, [user]);

  // fetch events list
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const d = await apiFetch("/api/events/user/upcoming");
      const now = Date.now();
      // Client-side guard: only truly future events
      const sorted = (d.data || [])
        .filter((e) => e.status !== 'cancelled' && new Date(e.startDate).getTime() > now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      setEvents(sorted);

      // New event popup — once per session
      if (!popupShown.current && sorted.length > 0) {
        if (!sessionStorage.getItem("bondly_popup_shown")) {
          setNewEventPopup(sorted[0]); // already sorted newest first
          sessionStorage.setItem("bondly_popup_shown", "1");
          popupShown.current = true;
        }
      }
    } catch (e) {
      setEventsError(e.message || "Could not load events.");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // join / leave from main list
  const handleJoin = async (eventId) => {
    try {
      await apiFetch(`/api/events/${eventId}/join`, { method: "POST", body: JSON.stringify({ status: "going" }) });
      toast({ title: "✅ You're now attending this event!" });
      fetchEvents();
    } catch (e) {
      toast({ title: e.message || "Could not join", variant: "destructive" });
    }
  };

  const handleLeave = async (eventId) => {
    try {
      await apiFetch(`/api/events/${eventId}/leave`, { method: "POST" });
      toast({ title: "You've left this event." });
      fetchEvents();
    } catch (e) {
      toast({ title: e.message || "Could not leave", variant: "destructive" });
    }
  };

  if (!user) return null;

  // Only 3 stat cards — Community Friends removed
  const statsData = [
    { label: "Active Groups", value: stats.groupsJoined, icon: Users, color: "text-primary", bgColor: "bg-primary/10", delay: 0, panel: "groups" },
    { label: "Activities Joined", value: stats.activitiesParticipated, icon: Activity, color: "text-emerald-500", bgColor: "bg-emerald-500/10", delay: 80, panel: "activities" },
    { label: "Events Scheduled", value: stats.eventsScheduled, icon: Calendar, color: "text-purple-500", bgColor: "bg-purple-500/10", delay: 160, panel: "scheduled" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">

        {/* Welcome */}
        <div className="flex items-start justify-between mb-6">
          <div className="text-left">
            <h1 className="text-2xl font-semibold text-foreground text-left">
              Welcome back, {user?.username || user?.email?.split("@")[0] || "User"}! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1 text-left">Here's what's happening in your community today</p>
          </div>
          <Button onClick={() => navigate("/groups")}>Explore Groups</Button>
        </div>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {statsData.map((s, i) => (
            <StatCard key={i} {...s} loading={statsLoading} onClick={() => setPanel(s.panel)} />
          ))}
        </div>

        {/* Upcoming Events */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
              <span className="text-sm font-normal text-muted-foreground">(newest first)</span>
            </CardTitle>
            <Button size="sm" variant="ghost" className="text-primary text-sm"
              onClick={() => setPanel("activities")}>
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <EventsList
              events={events}
              loading={eventsLoading}
              error={eventsError}
              onRetry={fetchEvents}
              navigate={navigate}
              onJoin={handleJoin}
              onLeave={handleLeave}
              currentUserId={user._id || user.id}
            />
          </CardContent>
        </Card>
      </div>

      {/* Side Panels */}
      {panel === "groups" && <ActiveGroupsPanel onClose={() => setPanel(null)} />}
      {panel === "activities" && <ActivitiesPanel onClose={() => setPanel(null)} currentUserId={user._id || user.id} />}
      {panel === "scheduled" && <EventsScheduledPanel onClose={() => setPanel(null)} currentUserId={user._id || user.id} />}

      {/* New Event Popup */}
      {newEventPopup && (
        <NewEventPopup
          event={newEventPopup}
          onClose={() => setNewEventPopup(null)}
          onView={() => { setNewEventPopup(null); setPanel("activities"); }}
        />
      )}
    </div>
  );
}