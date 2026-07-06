/**
 * components/FlagUserModal.jsx
 *
 * Modal for flagging a member inside a group.
 * The flag is scoped to the group — the group's own admin will review it.
 *
 * Props:
 *   flaggedUser  — { _id, username, fullName }
 *   groupId      — string  (which group the incident happened in)
 *   groupName    — string  (shown in UI for context)
 *   isOpen       — boolean
 *   onClose      — () => void
 */

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from './ui/dialog';
import { Button }   from './ui/button';
import { Textarea } from './ui/textarea';
import { Input }    from './ui/input';
import { Label }    from './ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from './ui/select';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Flag, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const REASONS = [
  { value: 'harassment',            label: 'Harassment or Bullying' },
  { value: 'hate_speech',           label: 'Hate Speech or Discrimination' },
  { value: 'spam',                  label: 'Spam or Fake Account' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'impersonation',         label: 'Impersonation' },
  { value: 'threats',               label: 'Threats or Violence' },
  { value: 'misinformation',        label: 'Misinformation' },
  { value: 'other',                 label: 'Other' },
];

export default function FlagUserModal({
  flaggedUser,
  groupId,
  groupName,
  isOpen,
  onClose,
}) {
  const { toast } = useToast();

  const [reason,      setReason]      = useState('');
  const [description, setDescription] = useState('');
  const [proofUrl,    setProofUrl]    = useState('');
  const [proofText,   setProofText]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [submitted,   setSubmitted]   = useState(false);

  const reset = () => {
    setReason(''); setDescription('');
    setProofUrl(''); setProofText('');
    setSubmitted(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !description.trim()) {
      toast({ title: 'Please fill in reason and description.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/flags`, {
        method  : 'POST',
        headers : {
          'Content-Type': 'application/json',
          Authorization : `Bearer ${token}`,
        },
        body: JSON.stringify({
          flaggedUserId: flaggedUser._id,
          groupId,
          reason,
          description : description.trim(),
          proofUrl    : proofUrl.trim(),
          proofText   : proofText.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast({ title: '🚩 Report submitted to the group admin.' });
      } else {
        toast({ title: data.message || 'Could not submit report.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Server error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!flaggedUser) return null;
  const initials = (flaggedUser.username || 'U').charAt(0).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Report a Member
          </DialogTitle>
          <DialogDescription>
            Your report goes to the <strong>{groupName || 'group'}</strong> admin for review —
            not to Bondly staff. False reports may result in action against your own account.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Flag className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Report Submitted</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Your report against <strong>{flaggedUser.username}</strong> has been sent to
              the <strong>{groupName}</strong> admin for review.
            </p>
            <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground text-left space-y-1">
              <p className="font-semibold">What happens next:</p>
              <p>• The group admin reviews your report and evidence.</p>
              <p>• If approved: 1st flag = warning, 2nd flag = 2-month ban, 3rd flag = permanent ban.</p>
              <p>• If rejected: no action is taken against the member.</p>
            </div>
            <Button onClick={handleClose} className="mt-2">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-2">

            {/* Who is being flagged */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{flaggedUser.username}</p>
                {flaggedUser.fullName && (
                  <p className="text-xs text-muted-foreground">{flaggedUser.fullName}</p>
                )}
              </div>
              <span className="ml-auto text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                Being reported
              </span>
            </div>

            {/* Group context */}
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              This report is for behaviour inside <strong>{groupName}</strong> and will be
              reviewed by that group's admin only.
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">
                Describe what happened <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                rows={4}
                maxLength={1000}
                placeholder="Explain clearly what this member did, when, and where in the group…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground text-right">
                {description.length} / 1000
              </p>
            </div>

            {/* Proof URL */}
            <div className="space-y-1.5">
              <Label htmlFor="proofUrl" className="text-sm font-medium">
                Screenshot URL <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="proofUrl"
                type="url"
                placeholder="https://imgur.com/your-screenshot.png"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Upload to Imgur, Google Drive etc. and paste the link here.
              </p>
            </div>

            {/* Proof text */}
            <div className="space-y-1.5">
              <Label htmlFor="proofText" className="text-sm font-medium">
                Paste message or content <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="proofText"
                rows={3}
                maxLength={2000}
                placeholder="Paste the offensive message or relevant content here…"
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
              />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Submitting a false or malicious report is a violation of community guidelines
                and may result in action against your account.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !reason || !description.trim()}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {loading ? 'Submitting…' : (
                  <><Flag className="h-4 w-4 mr-2" />Submit Report</>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}