/**
 * pages/EnhancedGroupDetails.jsx
 *
 * Key changes from previous version:
 *  1. Manage panel restructured: Settings | Members | (Reports moved INSIDE Members,
 *     reached via a "View Reports" button — no longer a top-level tab)
 *  2. Members tab (main page): clicking a member's name/avatar opens a Member
 *     Profile Modal showing bio, location, interests, join date, stats — for
 *     any non-flagged-button area of the row
 *  3. Manage → Settings: fully editable group name, image URL, description,
 *     category, location
 *  4. Manage → Settings: new "Rules & Preferences" editable section —
 *     add/remove custom rules
 *  5. Manage → Members: every member listed with flag button + a button to
 *     view that member's pending/approved flags
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft, Users, MapPin, Calendar, Clock, Settings,
  MessageCircle, Heart, Trophy, Crown, Star,
  UserPlus, UserMinus, Edit, Flag, Link2, Image as ImageIcon,
  CheckCircle, XCircle, Loader2, AlertTriangle,
  ChevronDown, ChevronUp, ShieldCheck, CalendarDays,
  Plus, Trash2, Save, X, Mail, User as UserIcon,
} from 'lucide-react';
import { Badge }    from '../components/ui/badge';
import { Button }   from '../components/ui/button';
import { Input }    from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import { useAuth }  from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import FlagUserModal from '../components/FlagUserModal';

const ROOT = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${ROOT}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const REASON_LABELS = {
  harassment: 'Harassment', hate_speech: 'Hate Speech',
  spam: 'Spam', inappropriate_content: 'Inappropriate Content',
  impersonation: 'Impersonation', threats: 'Threats',
  misinformation: 'Misinformation', other: 'Other',
};

const CATEGORY_OPTIONS = [
  'social', 'sports', 'arts', 'technology', 'food',
  'music', 'travel', 'fitness', 'gaming', 'other',
];

const FALLBACK = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=400&fit=crop';

function fmtD(d) { try { return format(new Date(d), 'EEE, MMM d yyyy'); } catch { return '—'; } }
function fmtT(d) { try { return format(new Date(d), 'h:mm a'); } catch { return '—'; } }

function StatusPill({ status }) {
  const map = {
    upcoming : 'bg-emerald-100 text-emerald-700',
    ongoing  : 'bg-blue-100   text-blue-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100    text-red-600',
  };
  return (
    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function BanBadge({ banStatus }) {
  if (!banStatus || banStatus === 'active') return null;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
      banStatus === 'perm_banned' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
    }`}>
      {banStatus === 'perm_banned' ? 'Perm Banned' : 'Temp Banned'}
    </span>
  );
}

// ── Member Profile Modal ──────────────────────────────────────────────────────
function MemberProfileModal({ member, isOpen, onClose, roleLabel }) {
  if (!member) return null;
  const initials = (member.username || 'U').charAt(0).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">{member.username}'s Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <Avatar className="h-20 w-20 ring-4 ring-primary/10 mb-3">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-bold text-foreground">{member.username}</h3>
          {member.fullName && (
            <p className="text-sm text-muted-foreground">{member.fullName}</p>
          )}
          {roleLabel && (
            <span className="mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {roleLabel}
            </span>
          )}
        </div>

        <div className="space-y-4 text-left border-t border-border pt-4">
          {member.bio && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Bio</p>
              <p className="text-sm text-foreground leading-relaxed">{member.bio}</p>
            </div>
          )}

          {member.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              {member.location}
            </div>
          )}

          {member.createdAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
              Joined Bondly on {fmtD(member.createdAt)}
            </div>
          )}

          {member.interests?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {member.interests.map((interest, i) => (
                  <span key={i} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {member.stats && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Activity</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Groups',     member.stats.groupsCount],
                  ['Activities', member.stats.activitiesCount],
                  ['Friends',    member.stats.friendsCount],
                  ['Events',     member.stats.eventsCount],
                ].map(([label, val]) => (
                  <div key={label} className="bg-muted/50 rounded-xl p-2.5 text-center">
                    <p className="text-base font-bold text-foreground">{val ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!member.bio && !member.location && member.interests?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              This member hasn't added more profile details yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Flag review card ──────────────────────────────────────────────────────────
function FlagReviewCard({ flag, onApprove, onReject, actionLoading }) {
  const [expanded,  setExpanded]  = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const flagCount = flag.flaggedUser?.flagCount || 0;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button className="w-full p-3 text-left hover:bg-muted/50 transition-colors" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="font-medium">{flag.reporter?.username}</span>
          <span className="text-muted-foreground text-xs">→</span>
          <span className="font-semibold text-destructive">{flag.flaggedUser?.username}</span>
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{REASON_LABELS[flag.reason] || flag.reason}</span>
          <span className="text-xs text-muted-foreground ml-auto">{new Date(flag.createdAt).toLocaleDateString()}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t bg-muted/20 p-4 space-y-3 text-xs">
          <div className={`flex gap-2 p-2.5 rounded-lg border text-xs ${
            flagCount + 1 >= 3 ? 'bg-red-50 border-red-200 text-red-700'
            : flagCount + 1 === 2 ? 'bg-orange-50 border-orange-200 text-orange-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <p>{flagCount + 1 >= 3 ? '⚠️ Approving will PERMANENTLY BAN this member.'
              : flagCount + 1 === 2 ? '⚠️ Approving will TEMP BAN for 2 months.'
              : 'ℹ️ First flag — warning only, no ban yet.'} Flags so far: {flagCount}.</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
            <p className="bg-background border rounded-lg p-2 whitespace-pre-wrap leading-relaxed">{flag.description}</p>
          </div>
          {flag.proofUrl && (
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Proof Link</p>
              <a href={flag.proofUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{flag.proofUrl}</a>
            </div>
          )}
          {flag.proofText && (
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pasted Evidence</p>
              <p className="bg-background border rounded-lg p-2 font-mono whitespace-pre-wrap">{flag.proofText}</p>
            </div>
          )}
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Your Note (optional)</p>
            <Textarea rows={2} maxLength={500} placeholder="Explain your decision…"
              value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="text-xs" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={actionLoading === flag._id}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
              onClick={() => onApprove(flag._id, adminNote)}>
              {actionLoading === flag._id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
              Approve
            </Button>
            <Button size="sm" variant="outline" disabled={actionLoading === flag._id}
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs"
              onClick={() => onReject(flag._id, adminNote)}>
              {actionLoading === flag._id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Manage → Settings (editable group form + rules) ──────────────────────────
function ManageSettingsPanel({ group, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name       : group.name || '',
    description: group.description || '',
    category   : group.category || 'other',
    location   : group.location || '',
    image      : group.image || '',
  });
  const [rules, setRules]             = useState(group.rules?.length ? [...group.rules] : []);
  const [newRule, setNewRule]         = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addRule = () => {
    if (!newRule.trim()) return;
    if (rules.length >= 20) { toast({ title: 'Maximum 20 rules allowed.', variant: 'destructive' }); return; }
    setRules((r) => [...r, newRule.trim()]);
    setNewRule('');
  };
  const removeRule = (idx) => setRules((r) => r.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast({ title: 'Name and description are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/api/groups/${group._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name       : form.name.trim(),
          description: form.description.trim(),
          category   : form.category,
          location   : form.location.trim(),
          image      : form.image.trim() || undefined,
          rules,
        }),
      });
      toast({ title: '✅ Group settings saved!' });
      onSaved();
    } catch (err) {
      toast({ title: err.message || 'Could not save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Group Info ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Group Info</p>
        <div className="space-y-3">

          {/* Image preview + URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" /> Cover Image URL
            </label>
            <div className="flex gap-2 items-start">
              <img
                src={form.image || FALLBACK}
                alt="preview"
                className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0"
              />
              <Input
                value={form.image}
                placeholder="https://images.unsplash.com/..."
                onChange={(e) => set('image', e.target.value)}
                className="flex-1 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Group Name</label>
            <Input value={form.name} maxLength={100} onChange={(e) => set('name', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Description</label>
            <Textarea rows={3} maxLength={500} value={form.description}
              onChange={(e) => set('description', e.target.value)} />
            <p className="text-[10px] text-muted-foreground text-right">{form.description.length}/500</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Category</label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Location
              </label>
              <Input value={form.location} maxLength={100} placeholder="e.g., Downtown"
                onChange={(e) => set('location', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Rules ── */}
      <div className="border-t border-border pt-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Community Rules ({rules.length}/20)
        </p>
        <div className="space-y-2 mb-3">
          {rules.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No rules added yet.</p>
          ) : (
            rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-muted/40 rounded-lg p-2.5">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="flex-1 text-sm text-foreground">{rule}</p>
                <button onClick={() => removeRule(idx)} className="text-muted-foreground hover:text-red-500 flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={newRule}
            placeholder="Add a new rule…"
            maxLength={200}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
            className="text-sm"
          />
          <Button type="button" size="sm" variant="outline" onClick={addRule} className="flex-shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Save */}
      <div className="border-t border-border pt-4">
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}

// ── Manage → Members (flag + view reports per member) ────────────────────────
function ManageMembersPanel({ group, groupId, currentUserId, onOpenFlag }) {
  const { toast } = useToast();
  const [memberFlags,  setMemberFlags]  = useState(null); // { memberId, flags: [] } | null
  const [loadingFlags, setLoadingFlags] = useState(false);

  const viewMemberFlags = async (member) => {
    setLoadingFlags(true);
    setMemberFlags({ member, flags: [] });
    try {
      const data = await apiFetch(`/api/flags/group/${groupId}/all`);
      const relevant = (data.data || []).filter((f) => f.flaggedUser?._id === member._id);
      setMemberFlags({ member, flags: relevant });
    } catch (err) {
      toast({ title: err.message || 'Could not load flags', variant: 'destructive' });
    } finally {
      setLoadingFlags(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        All Members ({group.memberCount})
      </p>

      {memberFlags ? (
        /* ── Member's flag history view ── */
        <div className="space-y-3">
          <button onClick={() => setMemberFlags(null)} className="text-xs text-primary flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to members
          </button>
          <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                {(memberFlags.member.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{memberFlags.member.username}</p>
              <p className="text-xs text-muted-foreground">
                {memberFlags.member.flagCount || 0} flag(s) on record
              </p>
            </div>
          </div>

          {loadingFlags ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : memberFlags.flags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No flag history for this member.</p>
          ) : (
            memberFlags.flags.map((f) => (
              <div key={f._id} className="border rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{REASON_LABELS[f.reason] || f.reason}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                    f.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                    : f.status === 'rejected' ? 'bg-gray-100 text-gray-600'
                    : 'bg-amber-100 text-amber-700'}`}>
                    {f.status}
                  </span>
                </div>
                <p className="text-muted-foreground">{f.description}</p>
                <p className="text-[10px] text-muted-foreground">
                  Reported by {f.reporter?.username} on {new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── Member list ── */
        <div className="space-y-2">
          {group.members.map((member) => {
            const memberId  = member._id || member;
            const isSelf    = memberId === currentUserId;
            const isCreator = memberId === (group.creator._id || group.creator);
            const isAdmin   = group.admins?.some((a) => (a._id || a) === memberId);

            return (
              <div key={memberId} className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-xl">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-primary/15 text-primary font-medium">
                    {(member.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.username}
                    {isCreator && <span className="ml-1 text-[10px] text-amber-600">(admin)</span>}
                    {isSelf && <span className="ml-1 text-[10px] text-emerald-600">(you)</span>}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {member.flagCount > 0 && (
                      <span className="text-[10px] text-muted-foreground">{member.flagCount} flag(s)</span>
                    )}
                    <BanBadge banStatus={member.banStatus} />
                  </div>
                </div>
                {!isCreator && (
                  <button
                    onClick={() => viewMemberFlags(member)}
                    className="text-[11px] text-primary hover:underline flex-shrink-0"
                  >
                    View flags
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function GroupDetails({ navigate, groupId }) {
  const { user }  = useAuth();
  const { toast } = useToast();

  const [group,         setGroup]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [isJoined,      setIsJoined]      = useState(false);
  const [activeTab,     setActiveTab]     = useState('overview');
  const [showManage,    setShowManage]    = useState(false);
  const [manageTab,     setManageTab]     = useState('settings'); // 'settings' | 'members'
  const [pendingFlagCount, setPendingFlagCount] = useState(0);

  const [flagTarget,    setFlagTarget]    = useState(null);
  const [flagOpen,      setFlagOpen]      = useState(false);

  const [profileMember, setProfileMember] = useState(null); // member shown in profile modal

  const [groupEvents,   setGroupEvents]   = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsTab,     setEventsTab]     = useState('upcoming');

  // ── fetch group ────────────────────────────────────────────────────────────
  const fetchGroup = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/groups/${groupId}`);
      setGroup(data.data);
      if (user) {
        const uid = user._id || user.id;
        setIsJoined(data.data.members.some((m) => (m._id || m) === uid));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [groupId, user]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  // ── pending flag count (for the notification dot on Members sub-tab) ───────
  const fetchPendingFlagCount = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/flags/group/${groupId}/pending`);
      setPendingFlagCount((data.data || []).length);
    } catch {
      // silent — admin will still see flags when opening Members tab
    }
  }, [groupId]);

  useEffect(() => {
    const uid = user?._id || user?.id;
    const admin = group && (group.creator._id === uid || group.admins?.some((a) => (a._id || a) === uid));
    if (admin) {
      fetchPendingFlagCount();
      // poll every 30s while the page is open so the dot stays fresh
      const iv = setInterval(fetchPendingFlagCount, 30000);
      return () => clearInterval(iv);
    }
  }, [group, user, fetchPendingFlagCount]);

  // ── fetch events ───────────────────────────────────────────────────────────
  const fetchGroupEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const data = await apiFetch(`/api/events/group/${groupId}?status=all`);
      setGroupEvents(data.data || []);
    } catch (err) { console.error(err); }
    finally { setEventsLoading(false); }
  }, [groupId]);

  useEffect(() => { if (activeTab === 'events') fetchGroupEvents(); }, [activeTab, fetchGroupEvents]);

  // ── join/leave ─────────────────────────────────────────────────────────────
  const handleJoinLeave = async () => {
    if (!user) { navigate('/auth'); return; }
    try {
      await apiFetch(`/api/groups/${groupId}/${isJoined ? 'leave' : 'join'}`, { method: 'POST' });
      setIsJoined(!isJoined);
      fetchGroup();
      toast({ title: isJoined ? 'Left group.' : '🎉 Joined group!' });
    } catch (err) { toast({ title: err.message || 'Action failed.', variant: 'destructive' }); }
  };

  // ── flag actions (used by Manage → Members "approve/reject" if needed elsewhere) ──
  const openFlag = (member) => { if (!user) { navigate('/auth'); return; } setFlagTarget(member); setFlagOpen(true); };

  // ── guards ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
  if (!group) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
      <p>Group not found.</p>
      <Button variant="outline" onClick={() => navigate('/groups')}>Back to Groups</Button>
    </div>
  );

  const currentUserId = user?._id || user?.id;
  const isGroupAdmin  = group.creator._id === currentUserId ||
    group.admins?.some((a) => (a._id || a) === currentUserId);

  const rulesToShow = group.rules?.length ? group.rules : [
    'Be respectful and welcoming to all members',
    'Share your experiences and knowledge openly',
    'Follow all community standards at all times',
  ];

  const TABS = [
    { id: 'overview', label: 'Overview',  icon: Heart },
    { id: 'events',   label: 'Events',    icon: CalendarDays },
    { id: 'members',  label: `Members (${group.memberCount})`, icon: Users },
    { id: 'about',    label: 'About',     icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero Banner ── */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <img src={group.image || FALLBACK} alt={group.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        <button onClick={() => navigate('/groups')}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/90 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium transition-all">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {isGroupAdmin && (
          <button onClick={() => setShowManage(true)}
            className="absolute top-4 right-4 flex items-center gap-1.5 text-white/90 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium transition-all">
            <Settings className="h-4 w-4" /> Manage
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-5xl mx-auto flex items-end justify-between gap-4">
            <div>
              <span className="inline-block mb-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm capitalize border border-white/30">
                {group.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{group.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {group.memberCount} members</span>
                {group.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {group.location}</span>}
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {user ? (
                <>
                  <Button onClick={handleJoinLeave} size="sm"
                    className={`h-9 px-4 font-semibold shadow-lg ${
                      isJoined ? 'bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-sm'
                                : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
                    {isJoined ? <><UserMinus className="h-4 w-4 mr-1.5" />Leave</> : <><UserPlus className="h-4 w-4 mr-1.5" />Join Group</>}
                  </Button>
                  {isJoined && (
                    <Button onClick={() => navigate('/messages')} size="sm"
                      className="h-9 px-4 bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-sm">
                      <MessageCircle className="h-4 w-4 mr-1.5" /> Chat
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={() => navigate('/auth')} size="sm" className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                  Sign in to Join
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-base text-foreground mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" /> About This Community
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm text-left">{group.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Members',  value: group.memberCount,                       icon: Users,    color: 'text-blue-600',    bg: 'bg-blue-50'   },
                  { label: 'Category', value: group.category,                          icon: Star,     color: 'text-purple-600',  bg: 'bg-purple-50' },
                  { label: 'Since',    value: new Date(group.createdAt).getFullYear(),  icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50'},
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`${bg} border border-border/50 rounded-2xl p-4 text-left`}>
                    <Icon className={`h-5 w-5 ${color} mb-2`} />
                    <p className={`text-xl font-bold ${color} capitalize leading-none`}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-base text-foreground mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Community Rules
                </h2>
                <ul className="space-y-2 text-left">
                  {rulesToShow.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" /> Group Admin
                </h3>
                <button
                  onClick={() => setProfileMember({ ...group.creator })}
                  className="flex items-center gap-3 w-full text-left hover:bg-muted/40 rounded-xl p-1.5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
                    {group.creator.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{group.creator.username}</p>
                    <p className="text-xs text-muted-foreground">Admin since {new Date(group.createdAt).toLocaleDateString()}</p>
                  </div>
                </button>
              </div>

              {user && !isJoined && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-left">
                  <h3 className="font-semibold text-sm text-foreground mb-1">Want to join?</h3>
                  <p className="text-xs text-muted-foreground mb-3">Join to attend events, chat with members, and be part of the community.</p>
                  <Button onClick={handleJoinLeave} size="sm" className="w-full"><UserPlus className="h-4 w-4 mr-1.5" /> Join Group</Button>
                </div>
              )}

              {isJoined && (
                <div className="bg-card border border-border rounded-2xl p-5 text-left">
                  <h3 className="font-semibold text-sm text-foreground mb-1">Group Chat</h3>
                  <p className="text-xs text-muted-foreground mb-3">Message members and stay up to date with discussions.</p>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/messages')}>
                    <MessageCircle className="h-4 w-4 mr-1.5" /> Open Chat
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ EVENTS ══ */}
        {activeTab === 'events' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg text-foreground">Group Events</h2>
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                {['upcoming', 'past'].map((t) => (
                  <button key={t} onClick={() => setEventsTab(t)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                      eventsTab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {eventsLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (() => {
              const now = Date.now();
              const filtered = groupEvents.filter((ev) => {
                const t = new Date(ev.startDate).getTime();
                return eventsTab === 'upcoming'
                  ? ev.status !== 'cancelled' && t > now
                  : t <= now || ev.status === 'cancelled';
              });

              if (filtered.length === 0) return (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 opacity-25" />
                  <p className="text-sm">{eventsTab === 'upcoming' ? 'No upcoming events yet.' : 'No past events found.'}</p>
                </div>
              );

              return (
                <div className="space-y-4">
                  {filtered.map((ev) => {
                    const going  = ev.attendees?.filter((a) => a.status === 'going') || [];
                    const isPast = new Date(ev.startDate).getTime() <= Date.now() || ev.status === 'cancelled';

                    return (
                      <div key={ev._id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-14 text-center bg-primary/10 rounded-xl py-2 px-1">
                            <p className="text-[10px] font-semibold text-primary uppercase">{ev.startDate ? format(new Date(ev.startDate), 'MMM') : '—'}</p>
                            <p className="text-2xl font-bold text-primary leading-none">{ev.startDate ? format(new Date(ev.startDate), 'd') : '—'}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h3 className="font-semibold text-foreground leading-snug">{ev.title}</h3>
                              <StatusPill status={isPast ? (ev.status === 'cancelled' ? 'cancelled' : 'completed') : ev.status} />
                            </div>
                            {ev.organizer?.username && <p className="text-xs text-muted-foreground mb-2">By {ev.organizer.username}</p>}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ev.startDate ? fmtT(ev.startDate) : '—'}</span>
                              {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <strong className="text-foreground">{going.length}</strong>&nbsp;{isPast ? 'attended' : 'attending'}
                                {ev.maxAttendees ? ` / ${ev.maxAttendees}` : ''}
                              </span>
                            </div>
                            {ev.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ev.description}</p>}
                            {going.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                {going.slice(0, 7).map((a, i) => (
                                  <Avatar key={a.user?._id || i} className="h-6 w-6 -ml-1.5 first:ml-0 border-2 border-background ring-1 ring-border">
                                    <AvatarFallback className="text-[9px] bg-primary/20 text-primary">{(a.user?.username || 'M').charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {going.length > 7 && <span className="text-[10px] text-muted-foreground ml-1.5">+{going.length - 7} more</span>}
                                {isPast && (
                                  <div className="flex flex-wrap gap-1 ml-2">
                                    {going.slice(0, 4).map((a, i) => (
                                      <span key={a.user?._id || i} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{a.user?.username || 'Member'}</span>
                                    ))}
                                    {going.length > 4 && <span className="text-[10px] text-muted-foreground">+{going.length - 4} more</span>}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ MEMBERS ══ */}
        {activeTab === 'members' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg text-foreground">
                Members <span className="text-muted-foreground font-normal text-base">({group.memberCount})</span>
              </h2>
              {user && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3 w-3" /> Flag icon to report · Click name for profile
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.members.map((member) => {
                const memberId  = member._id || member;
                const isSelf    = memberId === currentUserId;
                const isCreator = memberId === (group.creator._id || group.creator);
                const isAdmin   = group.admins?.some((a) => (a._id || a) === memberId);

                return (
                  <div key={memberId}
                    className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all">

                    {/* Clickable area → profile modal */}
                    <button
                      onClick={() => setProfileMember(member)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <Avatar className="h-11 w-11 flex-shrink-0 ring-2 ring-border">
                        <AvatarFallback className={`font-bold text-sm ${
                          isCreator ? 'bg-amber-100 text-amber-700' :
                          isAdmin   ? 'bg-blue-100 text-blue-700' :
                                      'bg-primary/10 text-primary'}`}>
                          {(member.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <p className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors">{member.username}</p>
                          {isCreator && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-medium">
                              <Crown className="h-2.5 w-2.5" /> Admin
                            </span>
                          )}
                          {!isCreator && isAdmin && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Co-admin</span>
                          )}
                          {isSelf && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">You</span>
                          )}
                        </div>
                        {member.fullName && <p className="text-xs text-muted-foreground truncate">{member.fullName}</p>}
                      </div>
                    </button>

                    {/* Flag button — only for non-admins, non-self */}
                    {user && !isSelf && !isCreator && !isAdmin && (
                      <button onClick={() => openFlag(member)} title={`Report ${member.username}`}
                        className="flex-shrink-0 p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ ABOUT ══ */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 text-left">
              <h2 className="font-semibold text-base text-foreground mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" /> About This Group
              </h2>
              <p className="text-muted-foreground leading-relaxed text-sm text-left">{group.description}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 text-left">
              <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Group Details
              </h3>
              <div className="space-y-0">
                {[
                  ['Category', group.category],
                  ['Type',     group.type || 'interest'],
                  ['Location', group.location || 'Not specified'],
                  ['Members',  group.memberCount],
                  ['Created',  new Date(group.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center text-sm py-2.5 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground capitalize text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 text-left">
              <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Community Rules
              </h3>
              <ul className="space-y-3 text-left">
                {rulesToShow.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ── Manage Side Panel ── */}
      {showManage && isGroupAdmin && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" onClick={() => setShowManage(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="font-semibold text-foreground">Manage Group</h2>
                <p className="text-xs text-muted-foreground">{group.name}</p>
              </div>
              <button onClick={() => setShowManage(false)}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-tabs: Settings | Members (Reports lives inside Members) */}
            <div className="flex gap-1 px-3 py-2 border-b border-border bg-muted/30 flex-shrink-0">
              {[
                { id: 'settings', label: 'Settings' },
                { id: 'members',  label: 'Members'  },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setManageTab(id);
                    if (id === 'members') fetchPendingFlagCount();
                  }}
                  className={`relative flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    manageTab === id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {label}
                  {id === 'members' && pendingFlagCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {pendingFlagCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {manageTab === 'settings' && (
                <ManageSettingsPanel group={group} onSaved={fetchGroup} />
              )}
              {manageTab === 'members' && (
                <ManageMembersPanel
                  group={group}
                  groupId={groupId}
                  currentUserId={currentUserId}
                  onOpenFlag={openFlag}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Flag modal */}
      <FlagUserModal
        flaggedUser={flagTarget}
        groupId={groupId}
        groupName={group?.name}
        isOpen={flagOpen}
        onClose={() => { setFlagOpen(false); setFlagTarget(null); }}
      />

      {/* Member profile modal */}
      <MemberProfileModal
        member={profileMember}
        isOpen={!!profileMember}
        onClose={() => setProfileMember(null)}
        roleLabel={
          profileMember && (
            profileMember._id === (group.creator._id || group.creator) ? 'Group Admin' :
            group.admins?.some((a) => (a._id || a) === profileMember._id) ? 'Co-admin' :
            'Member'
          )
        }
      />
    </div>
  );
}