import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Phone, Video, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';



const localVideoRef = useRef(null);
const remoteVideoRef = useRef(null);
const peerRef = useRef(null); // IMPORTANT (instead of normal variable)

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API);

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

const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  localVideoRef.current.srcObject = stream;
  return stream;
};


const createPeerConnection = (stream) => {
  peerRef.current = new RTCPeerConnection();

  stream.getTracks().forEach(track => {
    peerRef.current.addTrack(track, stream);
  });

  peerRef.current.ontrack = (event) => {
    remoteVideoRef.current.srcObject = event.streams[0];
  };

  peerRef.current.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc_signal', {
        groupId: activeChat._id,
        data: event.candidate,
      });
    }
  };
};

const startVideoCall = async () => {
  const stream = await startCamera();

  createPeerConnection(stream);

  const offer = await peerRef.current.createOffer();
  await peerRef.current.setLocalDescription(offer);

  socket.emit('webrtc_signal', {
    groupId: activeChat._id,
    data: offer,
  });

  setInCall(true);
};



const Messages = () => {
  const { user } = useAuth();

  const [myGroups, setMyGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // 🔥 CALL STATES
  const [incomingCall, setIncomingCall] = useState(null);
  const [inCall, setInCall] = useState(false);

  const scrollRef = useRef(null);

  const initials = (n) =>
    (typeof n === 'string' ? n[0] : n?.username?.[0])?.toUpperCase() ?? '?';

  const isMyMsg = (msg) => {
    const sid = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
    return sid === user?._id;
  };

  // ================= SOCKET =================

  useEffect(() => {
    if (activeChat) {
      socket.emit('join_group', activeChat._id);
    }
  }, [activeChat]);

  useEffect(() => {
    socket.on('incoming_call', (data) => {
      setIncomingCall(data);
    });

    socket.on('webrtc_signal', async (data) => {
  if (!peerRef.current) return;

  if (data.type === 'offer') {
    const stream = await startCamera();
    createPeerConnection(stream);

    await peerRef.current.setRemoteDescription(data);

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    socket.emit('webrtc_signal', {
      groupId: activeChat._id,
      data: answer,
    });
  }

  if (data.type === 'answer') {
    await peerRef.current.setRemoteDescription(data);
  }

  if (data.candidate) {
    await peerRef.current.addIceCandidate(data);
  }
});

    socket.on('call_ended', () => {
      setIncomingCall(null);
      setInCall(false);
    });

    return () => socket.off();
  }, []);

  // ================= LOAD =================

  const loadMyGroups = useCallback(async () => {
    const data = await apiFetch('/api/groups/user/my-groups');
    setMyGroups(data.data || []);
  }, []);

  useEffect(() => {
    loadMyGroups();
  }, []);

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

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const data = await apiFetch(`/api/messages/${activeChat._id}`, {
      method: 'POST',
      body: JSON.stringify({ content: newMessage }),
    });

    setMessages(prev => [...prev, data.message]);
    setNewMessage('');
  };

  // 🔥 CALL FUNCTIONS
  const startCall = () => {
    socket.emit('start_call', {
      groupId: activeChat._id,
      caller: user,
      type: 'audio',
    });
    setInCall(true);
  };

  const startVideoCall = () => {
    socket.emit('start_call', {
      groupId: activeChat._id,
      caller: user,
      type: 'video',
    });
    setInCall(true);
  };

  // ================= UI =================

  return (
    <div className="h-[calc(100vh-64px)] flex">

      {/* SIDEBAR */}
      <div className="w-80 border-r bg-card">
        <ScrollArea>
          {myGroups.map(group => (
            <div
              key={group._id}
              onClick={async () => {
                setActiveChat(group);
                setShowGroupInfo(false);
                const res = await apiFetch(`/api/groups/${group._id}`);
                setGroupDetails(res.data);
              }}
              className="p-3 cursor-pointer hover:bg-accent flex gap-2"
            >
              <Avatar>
                <AvatarFallback>{initials(group.name)}</AvatarFallback>
              </Avatar>
              <span>{group.name}</span>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {activeChat && showGroupInfo ? (
          <>
            {/* HEADER */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button size="icon" onClick={() => setShowGroupInfo(false)}>
                <ArrowLeft />
              </Button>
              <h2 className="font-semibold">Group Info</h2>
            </div>

            {/* PROFILE */}
            <div className="flex flex-col items-center py-6 border-b bg-muted/20">
              <Avatar className="h-24 w-24 mb-3">
                <AvatarFallback className="text-3xl">
                  {initials(activeChat.name)}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-bold">{activeChat.name}</h2>

              <p className="text-sm text-muted-foreground">
                {groupDetails?.members?.length} members
              </p>

              <div className="flex gap-4 mt-3">
                <Button size="icon" onClick={startCall}><Phone /></Button>
                <Button size="icon" onClick={startVideoCall}><Video /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-4 py-3">
                <h3 className="font-semibold mb-2">Members</h3>
                {groupDetails?.members.map(m => (
                  <div key={m._id} className="flex justify-between py-2">
                    <span>{m.username}</span>
                    {groupDetails.admins.some(a => a._id === m._id) && (
                      <span className="text-xs text-primary">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : activeChat ? (
          <>
            {/* CHAT HEADER */}
            <div className="p-4 border-b flex justify-between">
              <h3 onClick={() => setShowGroupInfo(true)} className="cursor-pointer font-semibold">
                {activeChat.name}
              </h3>

              <div className="flex gap-2">
                <Button size="icon" onClick={startCall}><Phone /></Button>
                <Button size="icon" onClick={startVideoCall}><Video /></Button>
              </div>
            </div>

            {/* MESSAGES */}
            <ScrollArea className="flex-1 p-4">
              {messages.map(msg => (
                <div key={msg._id} className={`flex ${isMyMsg(msg) ? 'justify-end' : ''}`}>
                  <div className="bg-accent p-2 m-1 rounded max-w-xs">
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </ScrollArea>

            {/* INPUT */}
            <div className="p-4 flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button onClick={sendMessage}><Send /></Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            Select a chat
          </div>
        )}
      </div>

      {/* 🔥 INCOMING CALL POPUP */}
      {incomingCall && !inCall && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded text-center">
            <h2 className="font-bold">
              {incomingCall.caller.username} calling...
            </h2>

            <div className="flex gap-4 mt-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={() => {
                  socket.emit('accept_call', {
                    groupId: incomingCall.groupId,
                    user,
                  });
                  setInCall(true);
                  setIncomingCall(null);
                }}
              >
                Accept
              </button>

              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => setIncomingCall(null)}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 CALL SCREEN */}
      {inCall && (
  <div className="fixed inset-0 bg-black flex items-center justify-center z-50">

    {/* REMOTE VIDEO */}
    <video
      ref={remoteVideoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />

    {/* LOCAL VIDEO */}
    <video
      ref={localVideoRef}
      autoPlay
      muted
      playsInline
      className="absolute bottom-4 right-4 w-40 h-40 rounded-lg border"
    />

    <button
      className="absolute bottom-6 bg-red-500 px-4 py-2 rounded text-white"
      onClick={() => {
        socket.emit('end_call', { groupId: activeChat._id });
        setInCall(false);
      }}
    >
      End Call
    </button>
  </div>
)}
    </div>
  );
};

export default Messages;