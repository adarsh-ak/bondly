import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Send, ArrowLeft, Phone, Video, Smile, Mic, MicOff, Square, Paperclip, Camera, VideoOff, Users, BarChart2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API);

// ============================================================
// FIX #1: STUN-only ICE config sirf tab kaam karta hai jab dono
// participants "easy" NAT ke peeche hon. Alag networks (WiFi vs
// mobile data, alag ISP/company firewall) ke beech STUN kaafi
// nahi hai — connection "connecting"/"failed" par atak jaata hai
// aur remote stream kabhi milta hi nahi, isliye audio bhi chup
// rehta hai. TURN server add karna zaroori hai as a relay fallback.
//
// ⚠️ Neeche 'YOUR_TURN_SERVER' placeholder hai — ise apne actual
// TURN server (coturn self-hosted, ya Twilio/Xirsys/metered.ca
// jaisi service) ke credentials se replace karo. Env vars use
// karna better hai taaki secrets code mein hardcode na ho:
//   VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL
// ============================================================
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    ...(import.meta.env.VITE_TURN_URL
      ? [
          {
            urls: import.meta.env.VITE_TURN_URL, // e.g. 'turn:your-turn-server.com:3478'
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
        ]
      : []),
  ],
};

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

// long press ke liye time (ms)
const LONG_PRESS_DURATION = 450;

// WhatsApp jaisa: har group member ko ek fix (consistent) color mile
const MEMBER_COLORS = [
  '#e91e63', '#3f51b5', '#009688', '#ff9800',
  '#8e24aa', '#00897b', '#d84315', '#3949ab',
  '#c2185b', '#00acc1', '#f4511e', '#5e35b1',
];

// ============================================================
// FIX #4: MediaRecorder bina mimeType specify kiye browser ka
// default use karta hai. Safari/iOS 'audio/webm' support hi
// nahi karta ya partial support deta hai — recording ban to
// jaati hai lekin doosre device par (jahan iOS se play ho raha
// ho) silently decode fail ho jaata hai, koi error bhi nahi
// dikhta. Yahan explicitly ek supported mimeType choose karte
// hain aur wahi blob type mein bhi tag karte hain.
// ============================================================
const getSupportedAudioMimeType = () => {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  return candidates.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(t)) || '';
};

export default function Messages() {
  const { user } = useAuth();

  const [myGroups, setMyGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactingMsgId, setReactingMsgId] = useState(null);
  const [deleteMenuMsgId, setDeleteMenuMsgId] = useState(null);

  const scrollRef = useRef(null);

  // long press tracking
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  // voice message recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);

  // file / camera attachment
  const fileInputRef = useRef(null);

  // custom camera modal (photo + video, WhatsApp style)
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo'); // 'photo' | 'video'
  const [capturedPhoto, setCapturedPhoto] = useState(null); // dataURL preview
  const [capturedVideoUrl, setCapturedVideoUrl] = useState(null); // objectURL preview
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const cameraVideoRef = useRef(null); // live preview <video>
  const cameraCanvasRef = useRef(null); // hidden canvas for photo capture
  const cameraStreamRef = useRef(null);
  const camRecorderRef = useRef(null);
  const camChunksRef = useRef([]);
  const capturedVideoBlobRef = useRef(null);

  // ============================================================
  // ===================== POLL (Telegram style) =================
  // ============================================================
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

  // ============================================================
  // ==================== GROUP CALL STATE =======================
  // ============================================================
  // mesh WebRTC: har participant baaki sab se seedha (P2P) connected hai

  const [incomingCall, setIncomingCall] = useState(null); // { groupId, caller, type }
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState('audio'); // 'audio' | 'video'
  const [callGroupId, setCallGroupId] = useState(null);

  // socketId -> MediaStream (dusre logo ki video/audio)
  const [remoteStreams, setRemoteStreams] = useState({});
  // socketId -> { user, callType, audioEnabled, videoEnabled }
  const [participants, setParticipants] = useState({});
  // socketId -> 'new' | 'connecting' | 'connected' | 'failed' | 'disconnected' | 'closed'
  // (debug/diagnostic ke liye - taaki dikhe ki voice na aane ki wajah connection
  // fail hona hai ya kuch aur)
  const [connectionStates, setConnectionStates] = useState({});

  // agar browser autoplay policy ki wajah se kisi remote audio/video ka
  // play() block ho jaye, to ye true set hoga aur ek "tap to enable sound"
  // banner dikhega - click karte hi sab kuch guaranteed play ho jayega
  // (kyunki wo click ek direct user-gesture hai)
  const [audioBlocked, setAudioBlocked] = useState(false);

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const peersRef = useRef({}); // socketId -> RTCPeerConnection
  const remoteVideoRefs = useRef({}); // socketId -> <video> element (visual only, muted)
  const remoteAudioRefs = useRef({}); // socketId -> <audio> element (actual sound - hamesha mounted)
  const pendingIceCandidatesRef = useRef({}); // socketId -> candidates jo peer bante hi apply karni hain

  // FIX #3: remoteStreams ko ek ref mein bhi rakhte hain taaki stable
  // ref-callbacks (neeche) ke andar hamesha latest stream milе bina
  // unhe har render par recreate kiye (jo warna remount/replay ka
  // baar-baar trigger karta - audio glitch/restart ki ek wajah)
  const remoteStreamsRef = useRef({});
  useEffect(() => {
    remoteStreamsRef.current = remoteStreams;
  }, [remoteStreams]);

  // ============================================================
  // ================ UNREAD / NOTIFICATION BADGE =================
  // ============================================================
  // groupId -> unread count (naya message ya call aaya aur wo chat khuli
  // nahi thi) - WhatsApp jaisa green badge dikhane ke liye
  const [unreadCounts, setUnreadCounts] = useState({});

  // ================= HELPERS =================

  const initials = (n) =>
    (typeof n === 'string' ? n[0] : n?.username?.[0])?.toUpperCase() ?? '?';

  const isMyMsg = (msg) => {
    const sid = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
    return sid === user?.id;
  };

  // group ke har member ko ek consistent naam do (WhatsApp jaisa "kis member ne bheja")
  const getSenderName = (msg) => {
    if (typeof msg.sender === 'object') {
      return msg.sender.name || msg.sender.username || 'Unknown';
    }
    return 'Unknown';
  };

  // sender id se ek consistent color nikalte hain (hash) taaki wahi member
  // hamesha wahi color pae, bina naam padhe bhi pehchan ho jaye
  const getSenderColor = (msg) => {
    const sid = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
    if (!sid) return MEMBER_COLORS[0];

    let hash = 0;
    for (let i = 0; i < sid.length; i++) {
      hash = (hash * 31 + sid.charCodeAt(i)) % MEMBER_COLORS.length;
    }
    return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
  };

  // WhatsApp jaisa har message ke neeche chhota sa time (e.g. "09:41 PM")
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ============================================================
  // ==================== GROUP CALL LOGIC ========================
  // ============================================================

  // ek naye remote participant ke liye RTCPeerConnection banata hai
  const createPeerConnection = useCallback((socketId) => {
    if (peersRef.current[socketId]) return peersRef.current[socketId];

    const peer = new RTCPeerConnection(ICE_SERVERS);

    // apni local stream ke tracks is naye peer ko bhej do
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    // jab is peer se remote track aaye, use UI mein dikhao
    peer.ontrack = (event) => {
      console.log(`📡 track received from ${socketId}:`, event.track.kind);
      setRemoteStreams((prev) => ({ ...prev, [socketId]: event.streams[0] }));
    };

    // naye ICE candidates seedha us specific participant ko bhejo
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
          targetSocketId: socketId,
          candidate: event.candidate,
        });
      }
    };

    peer.onconnectionstatechange = () => {
      console.log(`🔗 connection state with ${socketId}:`, peer.connectionState);
      setConnectionStates((prev) => ({ ...prev, [socketId]: peer.connectionState }));
    };

    peer.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE state with ${socketId}:`, peer.iceConnectionState);
    };

    peersRef.current[socketId] = peer;

    // agar is socket ke koi ICE candidates pehle hi aa chuke the (peer banne
    // se pehle), unhe ab apply kar do - taaki koi candidate drop na ho
    const queued = pendingIceCandidatesRef.current[socketId];
    if (queued && queued.length) {
      queued.forEach((candidate) => {
        peer.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
          console.error('Queued ICE candidate error:', err);
        });
      });
      delete pendingIceCandidatesRef.current[socketId];
    }

    return peer;
  }, []);

  // kisi peer ke liye offer banao aur bhejo (naya joiner existing members ko offer bhejta hai)
  const createOfferTo = useCallback(async (socketId, remoteUser) => {
    const peer = createPeerConnection(socketId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit('webrtc_offer', {
      targetSocketId: socketId,
      offer,
      fromUser: user,
    });

    setParticipants((prev) => ({
      ...prev,
      [socketId]: prev[socketId] || { user: remoteUser, audioEnabled: true, videoEnabled: true },
    }));
  }, [createPeerConnection, user]);

  const closePeer = useCallback((socketId) => {
    const peer = peersRef.current[socketId];
    if (peer) {
      peer.close();
      delete peersRef.current[socketId];
    }
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
    setParticipants((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
    delete remoteVideoRefs.current[socketId];
    delete remoteAudioRefs.current[socketId];
    delete pendingIceCandidatesRef.current[socketId];
    setConnectionStates((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  }, []);

  // caller ya koi bhi member: call shuru karo (ring karo group ko) aur khud bhi join ho jao
  const initiateCall = async (type) => {
    if (!activeChat) return;

    socket.emit('start_call', {
      groupId: activeChat._id,
      caller: user,
      type,
    });

    await joinCallSession(activeChat._id, type);
  };

  // accept karne wale ya caller khud - actual mic/camera lo aur call session join karo
  const joinCallSession = async (groupId, type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      localStreamRef.current = stream;
      // NOTE: yahan localVideoRef.current abhi null hoga kyunki <video> tag
      // sirf inCall=true hone ke baad DOM mein mount hota hai. Isliye assignment
      // ek useEffect mein hota hai jo inCall true hone ke baad chalta hai (neeche dekho).

      setCallType(type);
      setCallGroupId(groupId);
      setMicEnabled(true);
      setCamEnabled(type === 'video');
      setInCall(true);
      setIncomingCall(null);
      setAudioBlocked(false);

      socket.emit('join_call', { groupId, user, callType: type });
    } catch (err) {
      console.error('📵 mic/camera access failed:', err);
      alert('Camera/Microphone access chahiye call join karne ke liye.');
    }
  };

  // sirf local cleanup - peer connections band, camera/mic off, state reset
  // (server ko kuch nahi bataya - ye tab use hota hai jab SERVER pehle hi
  // bata chuka ho ki call khatam ho gayi hai, e.g. jab initiator ne call end ki)
  const cleanupCallLocal = useCallback(() => {
    Object.keys(peersRef.current).forEach((socketId) => closePeer(socketId));
    peersRef.current = {};

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    setInCall(false);
    setCallGroupId(null);
    setRemoteStreams({});
    setParticipants({});
    setIncomingCall(null);
    setAudioBlocked(false);
  }, [closePeer]);

  // khud call chhodna hai (server ko bhi batana hai)
  const leaveCall = useCallback(() => {
    if (callGroupId) {
      socket.emit('leave_call', { groupId: callGroupId });
    }
    cleanupCallLocal();
  }, [callGroupId, cleanupCallLocal]);

  // refs taaki socket event listeners (jo sirf ek baar setup hote hain) hamesha
  // latest inCall/cleanupCallLocal ko access kar saken, stale closure na ho
  const inCallRef = useRef(false);
  const cleanupCallLocalRef = useRef(() => {});
  useEffect(() => { inCallRef.current = inCall; }, [inCall]);
  useEffect(() => { cleanupCallLocalRef.current = cleanupCallLocal; }, [cleanupCallLocal]);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()?.[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
    socket.emit('call_media_toggle', {
      groupId: callGroupId,
      audioEnabled: track.enabled,
    });
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()?.[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamEnabled(track.enabled);
    socket.emit('call_media_toggle', {
      groupId: callGroupId,
      videoEnabled: track.enabled,
    });
  };

  // ek helper: kisi bhi <video>/<audio> element ko explicitly play() karne ki
  // koshish karo. Agar browser ka autoplay policy block kare (NotAllowedError),
  // to error ko chup-chaap ignore mat karo - audioBlocked flag set karo taaki
  // user ko "tap to enable sound" banner dikhe
  const tryPlay = useCallback((el) => {
    if (!el) return;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err) => {
        console.warn('🔇 autoplay blocked for element, waiting for user tap:', err?.name || err);
        setAudioBlocked(true);
      });
    }
  }, []);

  // "Tap to enable audio" banner par click hone par - saari currently mounted
  // remote video/audio elements ko dobara play() karo. Ye ek REAL user click
  // ke andar chal raha hai, isliye browser guarantee se allow karega.
  const enableAudioManually = () => {
    Object.values(remoteVideoRefs.current).forEach((el) => el?.play().catch(() => {}));
    Object.values(remoteAudioRefs.current).forEach((el) => el?.play().catch(() => {}));
    setAudioBlocked(false);
  };

  // ============================================================
  // ==================== INCOMING CALL RINGTONE ===================
  // ============================================================
  // Koi external audio file ki zaroorat nahi - Web Audio API se
  // do chhote "beep" tones generate karte hain (classic phone-ring
  // jaisa) aur unhe har 2 second par repeat karte hain jab tak
  // incoming call popup khula hai. Jaise hi call accept/reject ho
  // jaaye ya khud khatam ho jaaye (incomingCall null ho jaaye), ya
  // hum khud pehle se kisi call mein ho, ringtone ruk jaati hai.
  //
  // NOTE: browsers audio ko sirf user-gesture ke baad allow karte
  // hain. Chunki user is chat app mein pehle se click/type kar
  // chuka hota hai (message bhejna, chat kholna waghera), AudioContext
  // us interaction se already "unlocked" ho chuka hota hai - isliye
  // ye incoming-call jaisa bina-gesture wale trigger par bhi generally
  // bajti hai.
  const ringAudioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);

  const playRingBeep = useCallback(() => {
    try {
      if (!ringAudioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        ringAudioCtxRef.current = new AudioCtx();
      }
      const ctx = ringAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      // do quick tones ek ke baad ek - classic "ring-ring" pattern
      [0, 0.35].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.2, now + offset + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + offset + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.3);
      });
    } catch (err) {
      console.warn('🔔 ringtone beep failed:', err);
    }
  }, []);

  useEffect(() => {
    const shouldRing = !!incomingCall && !inCall;

    if (shouldRing) {
      playRingBeep();
      if (navigator.vibrate) navigator.vibrate([300, 200, 300]);
      ringIntervalRef.current = setInterval(() => {
        playRingBeep();
        if (navigator.vibrate) navigator.vibrate([300, 200, 300]);
      }, 2000);
    } else if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }

    return () => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    };
  }, [incomingCall, inCall, playRingBeep]);

  // remote <video> aur <audio> dono elements ko unki stream assign karna
  // (audio wala hamesha mount rehta hai taaki voice kabhi na ruke, chahe video off ho)
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([socketId, stream]) => {
      const videoEl = remoteVideoRefs.current[socketId];
      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
        tryPlay(videoEl);
      }
      const audioEl = remoteAudioRefs.current[socketId];
      if (audioEl && audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
        tryPlay(audioEl);
      }
    });
  }, [remoteStreams, tryPlay]);

  // ============================================================
  // FIX #3: pehle in-line arrow functions (`ref={(el) => bindRemoteAudioRef(socketId, el)}`)
  // JSX mein direct likhi jaati thi - ye har render par NAYA function
  // banati hain, jisse React purane ref ko null se call karke phir
  // element ke saath dobara call karta hai. Matlab har re-render
  // (jo call ke dauraan baar-baar hota hai - connectionState update,
  // participant toggle, etc.) par srcObject dobara assign + play()
  // dobara try hota hai - audio restart/glitch ki ek wajah.
  //
  // Yahan har socketId ke liye ek STABLE callback banate hain jo
  // memoize hokar cache ho jaata hai, taaki React use baar baar
  // remount na kare.
  // ============================================================
  const audioRefCallbacksRef = useRef({});
  const getAudioRefCallback = useCallback((socketId) => {
    if (!audioRefCallbacksRef.current[socketId]) {
      audioRefCallbacksRef.current[socketId] = (el) => {
        remoteAudioRefs.current[socketId] = el;
        const stream = remoteStreamsRef.current[socketId];
        if (el && stream && el.srcObject !== stream) {
          el.srcObject = stream;
          tryPlay(el);
        }
      };
    }
    return audioRefCallbacksRef.current[socketId];
  }, [tryPlay]);

  const videoRefCallbacksRef = useRef({});
  const getVideoRefCallback = useCallback((socketId) => {
    if (!videoRefCallbacksRef.current[socketId]) {
      videoRefCallbacksRef.current[socketId] = (el) => {
        remoteVideoRefs.current[socketId] = el;
        const stream = remoteStreamsRef.current[socketId];
        if (el && stream && el.srcObject !== stream) {
          el.srcObject = stream;
          tryPlay(el);
        }
      };
    }
    return videoRefCallbacksRef.current[socketId];
  }, [tryPlay]);

  // jab koi participant call se nikal jaye to uske cached ref-callback
  // bhi saaf kar do (memory leak se bachne ke liye)
  useEffect(() => {
    Object.keys(audioRefCallbacksRef.current).forEach((socketId) => {
      if (!(socketId in participants)) {
        delete audioRefCallbacksRef.current[socketId];
        delete videoRefCallbacksRef.current[socketId];
      }
    });
  }, [participants]);

  // local video preview: <video> tag sirf inCall=true hone ke baad DOM mein
  // aata hai, isliye stream ko yahan assign karna zaroori hai (joinCallSession
  // ke andar assign karne se woh element abhi mount hi nahi hua hota)
  useEffect(() => {
    if (inCall && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [inCall, callType]);

  // ================= WEBSOCKET =================

  useEffect(() => {
    if (!activeChat) return;
    socket.emit('join_group', activeChat._id);
  }, [activeChat]);

  useEffect(() => {
    // ---------- CHAT EVENTS ----------
    socket.on('message_error', (err) => {
      console.error('❌ message_error from server:', err);
    });

    socket.on('new_message', (message) => {
      const msgGroupId =
        typeof message.group === 'object' ? message.group._id : message.group;

      if (msgGroupId === activeChat?._id) {
        setMessages(prev => [...prev, message]);
      } else if (message.type !== 'call') {
        // 'call' type ka unread count already 'incoming_call' event se ho
        // chuka hota hai (real-time ring), isliye dobara mat badhao
        setUnreadCounts((prev) => ({
          ...prev,
          [msgGroupId]: (prev[msgGroupId] || 0) + 1,
        }));
      }
    });

    socket.on('message_reaction_updated', (updatedMessage) => {
      setMessages(prev =>
        prev.map(msg => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
    });

    socket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    // ---------- GROUP CALL EVENTS ----------

    // koi call ring kar raha hai group mein
    socket.on('incoming_call', (data) => {
      setIncomingCall(data);
      if (data.groupId !== activeChat?._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.groupId]: (prev[data.groupId] || 0) + 1,
        }));
      }
    });

    socket.on('call_rejected', () => {
      // koi ek member reject kare to abhi kuch nahi, baaki accept kar sakte hain
    });

    socket.on('call_ended', () => {
      setIncomingCall(null);
      // agar hum khud call mein the (aur ye hume kisi doosre wajah se pata chala,
      // jaise initiator ne call end kar di), to poora cleanup karo -
      // peer connections band, camera/mic light off, screen band
      if (inCallRef.current) {
        cleanupCallLocalRef.current();
      }
    });

    // hume already call mein maujood logo ki list mili - hum unko offer bhejenge
    socket.on('call_participants', ({ participants: existing }) => {
      existing.forEach((p) => {
        createOfferTo(p.socketId, p.user);
        setParticipants((prev) => ({
          ...prev,
          [p.socketId]: {
            user: p.user,
            audioEnabled: p.audioEnabled,
            videoEnabled: p.videoEnabled,
          },
        }));
      });
    });

    // ek naya banda call mein aaya - wo humein offer bhejega, hum bas wait karte hain
    socket.on('call_user_joined', ({ socketId, user: joinedUser, callType: joinedType }) => {
      setParticipants((prev) => ({
        ...prev,
        [socketId]: {
          user: joinedUser,
          audioEnabled: true,
          videoEnabled: joinedType === 'video',
        },
      }));
    });

    // kisi ne offer bheja - answer banao
    socket.on('webrtc_offer', async ({ fromSocketId, offer, fromUser }) => {
      const peer = createPeerConnection(fromSocketId);
      await peer.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit('webrtc_answer', {
        targetSocketId: fromSocketId,
        answer,
      });

      setParticipants((prev) => ({
        ...prev,
        [fromSocketId]: prev[fromSocketId] || { user: fromUser, audioEnabled: true, videoEnabled: true },
      }));
    });

    socket.on('webrtc_answer', async ({ fromSocketId, answer }) => {
      const peer = peersRef.current[fromSocketId];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('webrtc_ice_candidate', async ({ fromSocketId, candidate }) => {
      if (!candidate) return;
      const peer = peersRef.current[fromSocketId];
      if (peer) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('ICE candidate error:', err);
        }
      } else {
        // peer abhi bana hi nahi - candidate ko queue mein daal do,
        // jaise hi peer banega ye apply ho jaayega (pehle ye drop ho jaata tha)
        if (!pendingIceCandidatesRef.current[fromSocketId]) {
          pendingIceCandidatesRef.current[fromSocketId] = [];
        }
        pendingIceCandidatesRef.current[fromSocketId].push(candidate);
      }
    });

    socket.on('call_user_left', ({ socketId }) => {
      closePeer(socketId);
    });

    socket.on('call_media_toggle', ({ socketId, audioEnabled, videoEnabled }) => {
      setParticipants((prev) => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: {
            ...prev[socketId],
            ...(typeof audioEnabled === 'boolean' ? { audioEnabled } : {}),
            ...(typeof videoEnabled === 'boolean' ? { videoEnabled } : {}),
          },
        };
      });
    });

    return () => {
      socket.off('new_message');
      socket.off('message_reaction_updated');
      socket.off('message_deleted');
      socket.off('message_error');
      socket.off('incoming_call');
      socket.off('call_rejected');
      socket.off('call_ended');
      socket.off('call_participants');
      socket.off('call_user_joined');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      socket.off('call_user_left');
      socket.off('call_media_toggle');
    };
  }, [activeChat, createPeerConnection, createOfferTo, closePeer]);

  // ================= LOAD DATA =================

  const loadMyGroups = useCallback(async () => {
    const data = await apiFetch('/api/groups/user/my-groups');
    setMyGroups(data.data || []);
  }, []);

  useEffect(() => {
    loadMyGroups();
  }, []);

  // ZAROORI FIX: sirf currently khuli chat ke room mein join karne se
  // baaki groups ki incoming call notification kabhi milti hi nahi thi
  // (kyunki server sirf group room mein hi 'incoming_call' bhejta hai).
  // Isliye jaise hi user ke saare groups load ho jaayein, unn SABKE
  // socket rooms mein turant join ho jao - taaki koi bhi group call
  // karo, ring hamesha sabko sunayi de, chahe wo abhi kisi doosri
  // chat mein busy ho.
  useEffect(() => {
    myGroups.forEach((group) => {
      socket.emit('join_group', group._id);
    });
  }, [myGroups]);

  const loadMessages = useCallback(async () => {
    if (!activeChat) return;
    const data = await apiFetch(`/api/messages/${activeChat._id}`);
    setMessages(data.messages || []);
  }, [activeChat]);

  useEffect(() => {
    loadMessages();
  }, [activeChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ================= ACTIONS =================

  const onEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const reactToMessage = (messageId, emoji) => {
    if (!activeChat) return;
    socket.emit('react_message', {
      messageId,
      groupId: activeChat._id,
      userId: user.id,
      emoji,
    });
  };

  // ============ DELETE MESSAGE (WhatsApp style: for me / for everyone) ============

  const deleteForMe = (messageId) => {
    setMessages(prev => prev.filter(m => m._id !== messageId));
    setDeleteMenuMsgId(null);
  };

  const deleteForEveryone = (messageId) => {
    if (!activeChat) return;
    socket.emit('delete_message', {
      messageId,
      groupId: activeChat._id,
    });
    setDeleteMenuMsgId(null);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;

    socket.emit('send_message', {
      groupId: activeChat._id,
      senderId: user.id,
      content: newMessage,
    });

    setNewMessage('');
  };

  // ============ POLL (Telegram style: create + vote) ============

  const openPollModal = () => {
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollAllowMultiple(false);
    setShowPollModal(true);
  };

  const closePollModal = () => {
    setShowPollModal(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollAllowMultiple(false);
  };

  const updatePollOption = (idx, value) => {
    setPollOptions((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const addPollOption = () => {
    setPollOptions((prev) => (prev.length < 10 ? [...prev, ''] : prev));
  };

  const removePollOption = (idx) => {
    setPollOptions((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const createPoll = () => {
    if (!activeChat) return;
    const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || cleanOptions.length < 2) return;

    socket.emit('create_poll', {
      groupId: activeChat._id,
      senderId: user.id,
      question: pollQuestion.trim(),
      options: cleanOptions,
      allowMultiple: pollAllowMultiple,
    });

    closePollModal();
  };

  const votePoll = (messageId, optionIndex) => {
    if (!activeChat) return;
    socket.emit('vote_poll', {
      messageId,
      groupId: activeChat._id,
      userId: user.id,
      optionIndex,
    });
  };

  // ============ CUSTOM CAMERA (photo + video, WhatsApp style) ============

  const openCamera = async () => {
    setCapturedPhoto(null);
    setCapturedVideoUrl(null);
    capturedVideoBlobRef.current = null;
    setCameraMode('photo');
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('📷 camera access failed:', err);
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;

    if (capturedVideoUrl) URL.revokeObjectURL(capturedVideoUrl);

    setShowCamera(false);
    setCapturedPhoto(null);
    setCapturedVideoUrl(null);
    capturedVideoBlobRef.current = null;
    setIsRecordingVideo(false);
  };

  const capturePhoto = () => {
    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const sendCapturedPhoto = () => {
    if (!capturedPhoto || !activeChat) return;

    socket.emit('send_message', {
      groupId: activeChat._id,
      senderId: user.id,
      content: capturedPhoto,
      type: 'image',
    });

    closeCamera();
  };

  const startVideoRecording = () => {
    const stream = cameraStreamRef.current;
    if (!stream) return;

    const mimeType = getSupportedAudioMimeType() ? undefined : undefined; // video recorder uses its own defaults below
    const recorder = new MediaRecorder(stream);
    camRecorderRef.current = recorder;
    camChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) camChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(camChunksRef.current, { type: recorder.mimeType || 'video/webm' });
      camChunksRef.current = [];
      capturedVideoBlobRef.current = blob;
      setCapturedVideoUrl(URL.createObjectURL(blob));
    };

    recorder.start();
    setIsRecordingVideo(true);
  };

  const stopVideoRecording = () => {
    if (camRecorderRef.current && camRecorderRef.current.state !== 'inactive') {
      camRecorderRef.current.stop();
    }
    setIsRecordingVideo(false);
  };

  const retakeVideo = () => {
    if (capturedVideoUrl) URL.revokeObjectURL(capturedVideoUrl);
    setCapturedVideoUrl(null);
    capturedVideoBlobRef.current = null;
  };

  const sendCapturedVideo = () => {
    if (!capturedVideoBlobRef.current || !activeChat) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      socket.emit('send_message', {
        groupId: activeChat._id,
        senderId: user.id,
        content: reader.result,
        type: 'video',
      });
      closeCamera();
    };
    reader.readAsDataURL(capturedVideoBlobRef.current);
  };

  // ============ FILE & CAMERA ATTACHMENT ============

  const downloadDataUrl = async (dataUrl, fileName) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || 'file';
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('📎 download failed:', err);
    }
  };

  const sendFile = (file) => {
    if (!file || !activeChat) return;

    const isImage = file.type.startsWith('image/');

    const reader = new FileReader();
    reader.onloadend = () => {
      socket.emit('send_message', {
        groupId: activeChat._id,
        senderId: user.id,
        content: reader.result,
        type: isImage ? 'image' : 'file',
        fileName: file.name,
      });
    };
    reader.onerror = (e) => {
      console.error('📎 file read error:', e);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    sendFile(file);
    e.target.value = '';
  };

  // ============ VOICE MESSAGE (mic record & send) ============

  const startRecording = async () => {
    if (!activeChat) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      // FIX #4: explicitly pick a mimeType the current browser supports,
      // instead of leaving it to browser defaults (Safari/iOS often can't
      // play back plain 'audio/webm' recorded elsewhere).
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.onerror = (e) => {
        console.error('🎤 MediaRecorder error:', e.error || e);
      };

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // recorder.mimeType is the actual type the browser used to encode -
        // tag the blob with that so playback picks the right decoder.
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = [];

        recordingStreamRef.current?.getTracks().forEach(track => track.stop());
        recordingStreamRef.current = null;

        const reader = new FileReader();
        reader.onloadend = () => {
          socket.emit('send_message', {
            groupId: activeChat._id,
            senderId: user.id,
            content: reader.result,
            type: 'audio',
          });
        };
        reader.onerror = (e) => {
          console.error('🎤 FileReader error:', e);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access failed:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ============ LONG PRESS (WhatsApp style reaction) ============

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePressStart = (e, msgId) => {
    if (e.target.closest('button, a, audio, video')) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (err) {
      // ignore
    }

    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setReactingMsgId(prev => (prev === msgId ? null : msgId));
      setDeleteMenuMsgId(null);
      if (navigator.vibrate) navigator.vibrate(15);
    }, LONG_PRESS_DURATION);
  };

  const handlePressEnd = () => {
    clearLongPressTimer();
  };

  // chat kholte waqt uska unread badge saaf kar do
  const openChat = async (group) => {
    setActiveChat(group);
    setShowGroupInfo(false);
    setUnreadCounts((prev) => {
      if (!prev[group._id]) return prev;
      const next = { ...prev };
      delete next[group._id];
      return next;
    });
    const res = await apiFetch(`/api/groups/${group._id}`);
    setGroupDetails(res.data);
  };

  // ================= UI =================

  const totalInCallCount = Object.keys(participants).length + 1; // +1 for self

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 flex overflow-hidden bg-background z-20">

      {/* SIDEBAR - scroll disabled, sirf chat area scroll karega */}
      <div className="w-80 border-r bg-card flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          {myGroups.map(group => (
            <div
              key={group._id}
              onClick={() => openChat(group)}
              className={`p-3 cursor-pointer flex items-center gap-2 ${
                activeChat?._id === group._id
                  ? 'bg-pink-100 text-pink-900 hover:bg-pink-100'
                  : 'hover:bg-pink-50'
              }`}
            >
              <Avatar>
                <AvatarFallback>{initials(group.name)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{group.name}</span>

              {/* WhatsApp jaisa green unread badge - naya message ya call */}
              {unreadCounts[group._id] > 0 && (
                <span className="bg-green-500 text-white text-[11px] font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shrink-0">
                  {unreadCounts[group._id] > 99 ? '99+' : unreadCounts[group._id]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            Select a chat
          </div>
        ) : showGroupInfo ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 shrink-0">
              <Button size="icon" onClick={() => setShowGroupInfo(false)}>
                <ArrowLeft />
              </Button>
              <h2 className="font-semibold">Group Info</h2>
            </div>

            <div className="flex flex-col items-center py-6 border-b">
              <h2 className="text-xl font-bold">{activeChat.name}</h2>
              <p>{groupDetails?.members?.length} members</p>
            </div>
          </>
        ) : (
          <>
            {/* HEADER */}
            <div className="p-4 border-b flex justify-between sticky top-0 bg-background z-50 shrink-0 shadow-sm">
              <h3
                className="cursor-pointer font-semibold"
                onClick={() => setShowGroupInfo(true)}
              >
                {activeChat.name}
              </h3>

              <div className="flex gap-2">
                <Button size="icon" onClick={() => initiateCall('audio')} disabled={inCall}>
                  <Phone />
                </Button>
                <Button size="icon" onClick={() => initiateCall('video')} disabled={inCall}>
                  <Video />
                </Button>
              </div>
            </div>

            {/* MESSAGES */}
            <ScrollArea className="flex-1 min-h-0 p-4">
              {messages.map(msg => {
                // ---------- CALL LOG (missed / completed call) - WhatsApp jaisa,
                // beech mein centered pill, normal chat bubble jaisa nahi ----------
                if (msg.type === 'call') {
                  let callInfo = {};
                  try {
                    callInfo = JSON.parse(msg.content || '{}');
                  } catch (e) {
                    callInfo = {};
                  }
                  const isMissed = callInfo.status === 'missed';
                  const mins = Math.floor((callInfo.duration || 0) / 60);
                  const secs = (callInfo.duration || 0) % 60;
                  const CallIcon = callInfo.callType === 'video' ? Video : Phone;
                  const callTypeLabel = callInfo.callType === 'video' ? 'Video' : 'Voice';

                  // WhatsApp jaisa: same call-log ek hi message hai jo poore group ko
                  // dikhta hai, lekin uska LABEL viewer ke hisaab se badalta hai -
                  // jisne call ki (caller) usko kabhi "Missed" nahi dikhna chahiye
                  // (usne to call ki thi, miss kaise karega) - usko neutral "No answer"
                  // dikhta hai. Sirf jo member call receive nahi kar paaya, usी ko
                  // red "Missed call" dikhta hai.
                  const iAmCaller = isMyMsg(msg);
                  const showRedMissedStyle = isMissed && !iAmCaller;

                  let label;
                  if (isMissed) {
                    label = iAmCaller
                      ? `${callTypeLabel} call · No answer`
                      : `Missed ${callInfo.callType === 'video' ? 'video' : 'voice'} call`;
                  } else {
                    label = `${callTypeLabel} call · ${mins}:${String(secs).padStart(2, '0')}`;
                  }

                  return (
                    <div key={msg._id} className="flex flex-col items-center my-2">
                      <button
                        onClick={() => initiateCall(callInfo.callType || 'audio')}
                        disabled={inCall}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition ${
                          showRedMissedStyle
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-accent text-muted-foreground hover:bg-accent/70'
                        }`}
                      >
                        <CallIcon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                      </button>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                }

                // ---------- POLL (Telegram style) ----------
                if (msg.type === 'poll') {
                  const poll = msg.poll || {};
                  const options = poll.options || [];
                  const totalVotes = options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                  const myVotedIndexes = options.reduce((arr, o, idx) => {
                    const voted = (o.votes || []).some(
                      (v) => (typeof v === 'object' ? v._id : v) === user?.id
                    );
                    if (voted) arr.push(idx);
                    return arr;
                  }, []);

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMyMsg(msg) ? 'items-end' : 'items-start'} mb-2`}
                    >
                      {!isMyMsg(msg) && (
                        <span
                          className="text-xs font-semibold ml-1 mb-0.5"
                          style={{ color: getSenderColor(msg) }}
                        >
                          {getSenderName(msg)}
                        </span>
                      )}

                      <div
                        className={`p-3 rounded max-w-xs w-full ${
                          isMyMsg(msg) ? 'bg-primary text-primary-foreground' : 'bg-accent'
                        }`}
                      >
                        <p className="font-semibold mb-2 flex items-center gap-1.5 text-sm">
                          <BarChart2 className="h-4 w-4 shrink-0" />
                          {poll.question}
                        </p>

                        <div className="flex flex-col gap-1.5">
                          {options.map((opt, idx) => {
                            const voteCount = opt.votes?.length || 0;
                            const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                            const voted = myVotedIndexes.includes(idx);

                            return (
                              <button
                                key={idx}
                                onClick={() => votePoll(msg._id, idx)}
                                className={`relative text-left text-xs rounded px-2 py-1.5 overflow-hidden border transition ${
                                  voted ? 'border-current' : 'border-black/10'
                                }`}
                              >
                                <div
                                  className="absolute inset-0 bg-black/10"
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative flex justify-between gap-2">
                                  <span>{opt.text}</span>
                                  <span className="shrink-0 opacity-80">{pct}%</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <p className="text-[10px] opacity-70 mt-2">
                          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                          {poll.allowMultiple ? ' · multiple choice' : ''}
                        </p>
                      </div>

                      <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                }

                const reactionCounts = {};
                (msg.reactions || []).forEach(r => {
                  reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
                });

                const myReaction = (msg.reactions || []).find(
                  r => (typeof r.user === 'object' ? r.user._id : r.user) === user?.id
                );

                const isOpen = reactingMsgId === msg._id;

                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isMyMsg(msg) ? 'items-end' : 'items-start'} mb-2`}
                  >
                    {!isMyMsg(msg) && (
                      <span
                        className="text-xs font-semibold ml-1 mb-0.5"
                        style={{ color: getSenderColor(msg) }}
                      >
                        {getSenderName(msg)}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <div
                        className={`p-2 rounded max-w-xs select-none cursor-pointer ${
                          isMyMsg(msg)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-accent'
                        }`}
                        style={{
                          touchAction: 'pan-y',
                          ...(!isMyMsg(msg) ? { borderLeft: `3px solid ${getSenderColor(msg)}` } : {}),
                        }}
                        onPointerDown={(e) => handlePressStart(e, msg._id)}
                        onPointerUp={handlePressEnd}
                        onPointerLeave={handlePressEnd}
                        onPointerCancel={handlePressEnd}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (e.target.closest('button, a, audio, video')) return;
                          setReactingMsgId(null);
                          setDeleteMenuMsgId(prev => (prev === msg._id ? null : msg._id));
                        }}
                      >
                        {msg.type === 'audio' ? (
                          <audio controls src={msg.content} className="max-w-[220px] h-10" />
                        ) : msg.type === 'image' ? (
                          <img
                            src={msg.content}
                            alt={msg.fileName || 'image'}
                            className="max-w-[220px] rounded"
                          />
                        ) : msg.type === 'video' ? (
                          <video
                            controls
                            src={msg.content}
                            className="max-w-[220px] rounded"
                          />
                        ) : msg.type === 'file' ? (
                          <button
                            onClick={() => downloadDataUrl(msg.content, msg.fileName)}
                            className="underline flex items-center gap-1 text-left"
                          >
                            📎 {msg.fileName || 'Download file'}
                          </button>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>

                    {/* WhatsApp jaisa chhota time, bubble ke neeche */}
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                      {formatTime(msg.createdAt)}
                    </span>

                    {isOpen && (
                      <div className="flex gap-2 mt-1 bg-card border rounded-full px-2 py-1 shadow">
                        {['👍', '❤️', '😂', '😮'].map(emoji => (
                          <button
                            key={emoji}
                            className="hover:scale-125 transition"
                            onClick={() => {
                              reactToMessage(msg._id, emoji);
                              setReactingMsgId(null);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {deleteMenuMsgId === msg._id && (
                      <div className="flex flex-col mt-1 bg-card border rounded shadow text-sm overflow-hidden min-w-[160px]">
                        {isMyMsg(msg) && (
                          <button
                            className="px-3 py-2 text-left hover:bg-accent text-red-500"
                            onClick={() => deleteForEveryone(msg._id)}
                          >
                            Delete for everyone
                          </button>
                        )}
                        <button
                          className="px-3 py-2 text-left hover:bg-accent"
                          onClick={() => deleteForMe(msg._id)}
                        >
                          Delete for me
                        </button>
                        <button
                          className="px-3 py-2 text-left hover:bg-accent text-muted-foreground"
                          onClick={() => setDeleteMenuMsgId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {Object.keys(reactionCounts).length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => reactToMessage(msg._id, emoji)}
                            className={`text-xs px-1.5 py-0.5 rounded-full border ${
                              myReaction?.emoji === emoji ? 'bg-accent border-primary' : 'bg-background'
                            }`}
                          >
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </ScrollArea>

            {/* INPUT */}
            <div className="p-4 flex gap-2 relative">
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
              >
                <Smile />
              </Button>

              {showEmojiPicker && (
                <div className="absolute bottom-16 left-4 z-50">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}

              <input
                id="chat-file-input"
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />

              <label
                htmlFor="chat-file-input"
                className="inline-flex items-center justify-center h-10 w-10 rounded-md cursor-pointer hover:bg-accent"
              >
                <Paperclip className="h-5 w-5" />
              </label>

              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={openCamera}
              >
                <Camera />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={openPollModal}
                title="Create poll"
              >
                <BarChart2 />
              </Button>

              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={1}
                className="flex-1 h-10 min-h-0 resize-none rounded-full px-4 py-2"
              />
              <Button
                onClick={toggleRecording}
                className={isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}
              >
                {isRecording ? <Square /> : <Mic />}
              </Button>

              <Button onClick={sendMessage}>
                <Send />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ============ GROUP CALL UI ============ */}
      {inCall && createPortal(
        <div className="fixed inset-0 bg-zinc-900 flex flex-col z-[999]">
          {/* top bar */}
          <div className="p-4 flex items-center justify-between text-white shrink-0">
            <span className="font-semibold">{activeChat?.name}</span>
            <span className="flex items-center gap-1 text-sm text-white/70">
              <Users className="h-4 w-4" /> {totalInCallCount}
            </span>
          </div>

          {/* agar browser ne autoplay block kar diya ho, to manual enable banner */}
          {audioBlocked && (
            <button
              onClick={enableAudioManually}
              className="mx-4 mb-2 px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded-lg animate-pulse shrink-0"
            >
              🔊 Tap to enable audio
            </button>
          )}

          {/* video/participant grid - hamesha grid, sabka tile ek saath dikhta hai
              (chahe 2 log ho ya zyada, koi special 1-on-1 layout nahi) */}
          <div
            className="flex-1 grid gap-2 p-2 overflow-auto content-center"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, Math.ceil(Math.sqrt(totalInCallCount)))}, minmax(160px, 1fr))`,
            }}
          >
            {/* apna tile */}
            <div className="relative bg-zinc-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {callType === 'video' && camEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <Avatar className="h-16 w-16">
                  <AvatarFallback>{initials(user?.name || user?.username)}</AvatarFallback>
                </Avatar>
              )}
              <span className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">
                You {!micEnabled && '🔇'}
              </span>
            </div>

            {/* baaki sab participants - group ke sab log yahan ek saath dikhte hain */}
            {Object.entries(participants).map(([socketId, info]) => (
              <div
                key={socketId}
                className="relative bg-zinc-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center"
              >
                {/*
                  FIX #2: pehle yahan className="hidden" tha (display:none).
                  display:none wale media elements kai mobile browsers
                  (especially iOS Safari) mein autoplay/decode reliably
                  nahi karte - element technically mounted hota hai lekin
                  audio graph suspend rehta hai. Ab hum ise "visually
                  hidden" banate hain (1x1px, opacity:0) jo display block
                  rakhta hai - audio playback normal chalta hai.

                  FIX #3: ref ab stable per-socketId callback hai
                  (getAudioRefCallback), inline arrow function nahi -
                  isse har re-render par srcObject/play() dobara trigger
                  nahi hota.
                */}
                <audio
                  ref={getAudioRefCallback(socketId)}
                  autoPlay
                  playsInline
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />

                {info.videoEnabled && remoteStreams[socketId] ? (
                  // video sirf visual ke liye - muted hai kyunki audio upar
                  // wale <audio> tag se already aa rahi hai (ek hi source,
                  // koi double-audio conflict nahi)
                  <video
                    ref={getVideoRefCallback(socketId)}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>{initials(info.user?.name || info.user?.username)}</AvatarFallback>
                  </Avatar>
                )}
                <span className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">
                  {info.user?.name || info.user?.username || 'Member'} {info.audioEnabled === false && '🔇'}
                </span>
                {connectionStates[socketId] && connectionStates[socketId] !== 'connected' && (
                  <span className="absolute top-1 right-1 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded-full capitalize">
                    {connectionStates[socketId] === 'failed' ? '⚠️ Connection failed' : `${connectionStates[socketId]}…`}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* controls */}
          <div className="p-6 flex items-center justify-center gap-4 shrink-0">
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                micEnabled ? 'bg-white/20 text-white' : 'bg-white text-black'
              }`}
            >
              {micEnabled ? <Mic /> : <MicOff />}
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleCam}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  camEnabled ? 'bg-white/20 text-white' : 'bg-white text-black'
                }`}
              >
                {camEnabled ? <Video /> : <VideoOff />}
              </button>
            )}

            {/* Hang-up button: classic rotated-handset icon (no crossed-out
                phone glyph, jo chhote size par "%" jaisa dikh sakta tha) */}
            <button
              onClick={leaveCall}
              className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <Phone className="h-6 w-6 rotate-[135deg]" fill="currentColor" strokeWidth={1.5} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* INCOMING CALL (group ring) - hamesha dikhega, chahe uska chat khula ho ya na ho */}
      {incomingCall && !inCall && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
          <div className="bg-white p-6 rounded-lg text-center min-w-[280px]">
            <Avatar className="h-16 w-16 mx-auto mb-3">
              <AvatarFallback>{initials(incomingCall.caller?.name || incomingCall.caller?.username)}</AvatarFallback>
            </Avatar>
            <h2 className="font-semibold">{incomingCall.caller?.username || incomingCall.caller?.name}</h2>
            <p className="text-sm text-muted-foreground">
              {incomingCall.type === 'video' ? 'Video calling…' : 'Voice calling…'}
            </p>

            <div className="flex gap-4 mt-5 justify-center">
              <button
                className="bg-green-500 px-5 py-2 text-white rounded-full"
                onClick={() => joinCallSession(incomingCall.groupId, incomingCall.type)}
              >
                Accept
              </button>

              <button
                className="bg-red-500 px-5 py-2 text-white rounded-full"
                onClick={() => {
                  socket.emit('reject_call', { groupId: incomingCall.groupId, user });
                  setIncomingCall(null);
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM CAMERA MODAL - photo + video, WhatsApp style */}
      {showCamera && createPortal(
        <div className="fixed inset-0 bg-black flex flex-col z-[999]">
          <canvas ref={cameraCanvasRef} className="hidden" />

          <button
            className="absolute top-4 right-4 text-white text-2xl z-10"
            onClick={closeCamera}
          >
            ✕
          </button>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {capturedPhoto ? (
              <img src={capturedPhoto} alt="captured" className="max-h-full max-w-full" />
            ) : capturedVideoUrl ? (
              <video src={capturedVideoUrl} controls autoPlay className="max-h-full max-w-full" />
            ) : (
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="p-6 flex flex-col items-center gap-4">
            {capturedPhoto ? (
              <div className="flex gap-6">
                <button
                  className="px-4 py-2 bg-white/20 text-white rounded"
                  onClick={retakePhoto}
                >
                  Retake
                </button>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded"
                  onClick={sendCapturedPhoto}
                >
                  Send
                </button>
              </div>
            ) : capturedVideoUrl ? (
              <div className="flex gap-6">
                <button
                  className="px-4 py-2 bg-white/20 text-white rounded"
                  onClick={retakeVideo}
                >
                  Retake
                </button>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded"
                  onClick={sendCapturedVideo}
                >
                  Send
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-4 text-sm">
                  <button
                    className={cameraMode === 'photo' ? 'text-white font-semibold' : 'text-white/50'}
                    onClick={() => !isRecordingVideo && setCameraMode('photo')}
                  >
                    PHOTO
                  </button>
                  <button
                    className={cameraMode === 'video' ? 'text-white font-semibold' : 'text-white/50'}
                    onClick={() => !isRecordingVideo && setCameraMode('video')}
                  >
                    VIDEO
                  </button>
                </div>

                {cameraMode === 'photo' ? (
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-white/40"
                  />
                ) : (
                  <button
                    onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                    className={`w-16 h-16 rounded-full border-4 border-white/40 ${
                      isRecordingVideo ? 'bg-red-500 animate-pulse' : 'bg-white'
                    }`}
                  />
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* CREATE POLL MODAL - Telegram style */}
      {showPollModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-lg p-5 w-[340px] max-w-[90vw]">
            <h3 className="font-semibold mb-3">Create Poll</h3>

            <input
              type="text"
              placeholder="Ask a question"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3 text-sm"
            />

            <div className="flex flex-col gap-2 mb-2 max-h-52 overflow-y-auto">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => updatePollOption(idx, e.target.value)}
                    className="flex-1 border rounded px-3 py-1.5 text-sm"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(idx)}
                      className="text-red-500 text-sm px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {pollOptions.length < 10 && (
              <button
                onClick={addPollOption}
                className="text-sm text-primary mb-3"
              >
                + Add option
              </button>
            )}

            <label className="flex items-center gap-2 text-sm mb-4">
              <input
                type="checkbox"
                checked={pollAllowMultiple}
                onChange={(e) => setPollAllowMultiple(e.target.checked)}
              />
              Allow multiple answers
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={closePollModal}
                className="px-4 py-2 text-sm rounded hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={createPoll}
                className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground"
              >
                Create
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}