import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Phone, Video } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';

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

const startCamera = async (videoRef) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  if (videoRef.current) {
    videoRef.current.srcObject = stream;
  }

  return stream;
};

export default function Messages() {
  const { user } = useAuth();

  const [myGroups, setMyGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const [incomingCall, setIncomingCall] = useState(null);
  const [inCall, setInCall] = useState(false);

  const scrollRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

  // ================= HELPERS =================

  const initials = (n) =>
    (typeof n === 'string' ? n[0] : n?.username?.[0])?.toUpperCase() ?? '?';

  const isMyMsg = (msg) => {
    const sid = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
    return sid === user?._id;
  };

  const createPeerConnection = (stream) => {
    const peer = new RTCPeerConnection();
    peerRef.current = peer;

    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && activeChat) {
        socket.emit('webrtc_signal', {
          groupId: activeChat._id,
          data: event.candidate,
        });
      }
    };
  };

  // ================= WEBSOCKET =================

  useEffect(() => {
    if (!activeChat) return;
    socket.emit('join_group', activeChat._id);
  }, [activeChat]);

  useEffect(() => {
    const handleSignal = async (data) => {
      if (!peerRef.current && !data.type) return;

      // OFFER
      if (data.type === 'offer') {
        const stream = await startCamera(localVideoRef);
        createPeerConnection(stream);

        await peerRef.current.setRemoteDescription(data);

        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);

        socket.emit('webrtc_signal', {
          groupId: activeChat._id,
          data: answer,
        });

        setInCall(true);
      }

      // ANSWER
      if (data.type === 'answer') {
        await peerRef.current?.setRemoteDescription(data);
      }

      // ICE
      if (data.candidate) {
        await peerRef.current?.addIceCandidate(data);
      }
    };

    socket.on('webrtc_signal', handleSignal);

    socket.on('incoming_call', (data) => {
      setIncomingCall(data);
    });

    socket.on('call_ended', () => {
      setIncomingCall(null);
      setInCall(false);
    });

    return () => {
      socket.off('webrtc_signal', handleSignal);
      socket.off('incoming_call');
      socket.off('call_ended');
    };
  }, [activeChat]);

  // ================= LOAD DATA =================

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
    if (!newMessage.trim() || !activeChat) return;

    const data = await apiFetch(`/api/messages/${activeChat._id}`, {
      method: 'POST',
      body: JSON.stringify({ content: newMessage }),
    });

    setMessages(prev => [...prev, data.message]);
    setNewMessage('');
  };

  // ================= CALL =================

  const startCall = () => {
    if (!activeChat) return;

    socket.emit('start_call', {
      groupId: activeChat._id,
      caller: user,
      type: 'audio',
    });

    setInCall(true);
  };

  const startVideoCall = async () => {
    if (!activeChat) return;

    const stream = await startCamera(localVideoRef);
    createPeerConnection(stream);

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socket.emit('webrtc_signal', {
      groupId: activeChat._id,
      data: offer,
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

        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            Select a chat
          </div>
        ) : showGroupInfo ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
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
            <div className="p-4 border-b flex justify-between">
              <h3
                className="cursor-pointer font-semibold"
                onClick={() => setShowGroupInfo(true)}
              >
                {activeChat.name}
              </h3>

              <div className="flex gap-2">
                <Button size="icon" onClick={startCall}>
                  <Phone />
                </Button>
                <Button size="icon" onClick={startVideoCall}>
                  <Video />
                </Button>
              </div>
            </div>

            {/* MESSAGES */}
            <ScrollArea className="flex-1 p-4">
              {messages.map(msg => (
                <div
                  key={msg._id}
                  className={`flex ${isMyMsg(msg) ? 'justify-end' : ''}`}
                >
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
              <Button onClick={sendMessage}>
                <Send />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* CALL UI */}
      {inCall && (
        <div className="fixed inset-0 bg-black flex z-50">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-4 right-4 w-40 h-40 rounded border"
          />

          <button
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-500 px-4 py-2 text-white rounded"
            onClick={() => {
              socket.emit('end_call', { groupId: activeChat._id });
              setInCall(false);
            }}
          >
            End Call
          </button>
        </div>
      )}

      {/* INCOMING CALL */}
      {incomingCall && !inCall && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded text-center">
            <h2>{incomingCall.caller.username} calling...</h2>

            <div className="flex gap-4 mt-4">
              <button
                className="bg-green-500 px-4 py-2 text-white rounded"
                onClick={() => {
                  socket.emit('accept_call', {
                    groupId: incomingCall.groupId,
                    user,
                  });
                  setIncomingCall(null);
                  setInCall(true);
                }}
              >
                Accept
              </button>

              <button
                className="bg-red-500 px-4 py-2 text-white rounded"
                onClick={() => setIncomingCall(null)}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}