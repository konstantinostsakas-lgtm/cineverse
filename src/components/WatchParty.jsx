import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { MessageSquare, X, Mic, MicOff, Video, VideoOff, Send, ArrowLeft, Users } from 'lucide-react';

// 🌐 ΤΟΠΙΚΟ ΛΕΞΙΚΟ ΜΕΤΑΦΡΑΣΕΩΝ
const COMPONENT_STRINGS = {
  el: {
    roomUsers: "👥 Room Users",
    you: "Εσύ",
    openChat: "Άνοιγμα Chat",
    closeChat: "Κλείσιμο Chat",
    liveChat: "Live Chat",
    noMessages: "Δεν υπάρχουν μηνύματα. Στείλε το πρώτο!",
    placeholder: "Γράψε ένα μήνυμα...",
    cameraAlert: "Παρακαλώ δώστε δικαιώματα κάμερας για τη λειτουργία Watch Party!",
    goBack: "Επιστροφή",
    friends: "Friends"
  },
  en: {
    roomUsers: "👥 Room Users",
    you: "You",
    openChat: "Open Chat",
    closeChat: "Close Chat",
    liveChat: "Live Chat",
    noMessages: "No messages yet. Send the first one!",
    placeholder: "Type a message...",
    cameraAlert: "Please grant camera permissions for Watch Party!",
    goBack: "Back",
    friends: "Friends"
  }
};

// Configuration για το WebRTC για να δουλεύει σε διαφορετικά δίκτυα
const iceConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};

// Χρησιμοποιούμε το movieId για να ταυτίζεται με τη βάση και το backend
function WatchParty({ movieId, user, socket, movieUrl, currentLang = 'el' }) {
  const [peers, setPeers] = useState([]);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  
  // 🌍 Επιλογή γλώσσας
  const strings = COMPONENT_STRINGS[currentLang === 'en' ? 'en' : 'el'];
  
  const userVideoRef = useRef();
  const videoPlayerRef = useRef();
  const streamRef = useRef();
  const peersRef = useRef([]);
  const chatEndRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ 
      video: { width: 320, height: 240, frameRate: { ideal: 15 } }, 
      audio: true 
    })
    .then((stream) => {
      streamRef.current = stream;
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }

      socket.emit('join-watch-party', { 
        movieId, 
        userId: user.id, 
        username: user.name, 
        avatar: user.avatar 
      });

      socket.on('party-user-joined', ({ socketId, userId, username, avatar }) => {
        const peer = createPeer(socketId, socket.id, stream);
        peersRef.current.push({ peerId: socketId, peer });
        setPeers((users) => [...users, { peerId: socketId, peer, userId, username, avatar, isCameraOn: true }]);
      });

      socket.on('webrtc-offer-received', ({ senderSocketId, senderUsername, senderAvatar, senderUserId, offer }) => {
        const peer = addPeer(offer, senderSocketId, stream);
        peersRef.current.push({ peerId: senderSocketId, peer });
        setPeers((users) => [...users, { peerId: senderSocketId, peer, userId: senderUserId, username: senderUsername, avatar: senderAvatar, isCameraOn: true }]);
      });

      socket.on('webrtc-answer-received', ({ senderSocketId, answer }) => {
        const item = peersRef.current.find((p) => p.peerId === senderSocketId);
        if (item) item.peer.signal(answer);
      });

      socket.on('ice-candidate-received', ({ senderSocketId, candidate }) => {
        const item = peersRef.current.find((p) => p.peerId === senderSocketId);
        if (item) item.peer.signal(candidate);
      });

      socket.on('party-user-camera-changed', ({ userId, enabled }) => {
        setPeers((users) => users.map((u) => u.userId === userId ? { ...u, isCameraOn: enabled } : u));
      });

      socket.on('party-user-left', ({ userId }) => {
        const peerItem = peersRef.current.find(p => p.peer.userId === userId); // Διόρθωση αναφοράς
        if (peerItem && peerItem.peer) {
          peerItem.peer.destroy();
        }
        peersRef.current = peersRef.current.filter((p) => p.peer.userId !== userId);
        setPeers((users) => users.filter((u) => u.userId !== userId));
      });
    })
    .catch(err => {
      console.error("Σφάλμα στην κάμερα/μικρόφωνο:", err);
      alert(strings.cameraAlert);
    });

    socket.on('receive-party-message', (msgObj) => {
      setMessages((prev) => [...prev, msgObj]);
    });

    socket.on('player-control-broadcast', ({ action, currentTime }) => {
      if (!videoPlayerRef.current) return;
      if (Math.abs(videoPlayerRef.current.currentTime - currentTime) > 1.5) {
        videoPlayerRef.current.currentTime = currentTime;
      }
      if (action === 'play') videoPlayerRef.current.play();
      if (action === 'pause') videoPlayerRef.current.pause();
    });

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      socket.emit('leave-watch-party', { movieId, userId: user.id });
      socket.off('party-user-joined');
      socket.off('webrtc-offer-received');
      socket.off('webrtc-answer-received');
      socket.off('ice-candidate-received');
      socket.off('party-user-camera-changed');
      socket.off('party-user-left');
      socket.off('receive-party-message');
      socket.off('player-control-broadcast');
    };
  }, [movieId, socket, user, strings.cameraAlert]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  function createPeer(userToSignal, callerId, stream) {
    // Προσθήκη config εδώ
    const peer = new Peer({ initiator: true, trickle: false, stream, config: iceConfig });
    peer.on('signal', (signal) => {
      socket.emit('webrtc-offer', { 
        targetSocketId: userToSignal, 
        senderUsername: user.name,
        senderAvatar: user.avatar,
        senderUserId: user.id,
        offer: signal 
      });
    });
    peer.userId = userToSignal; // Helper για το κλείσιμο
    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    // Προσθήκη config εδώ
    const peer = new Peer({ initiator: false, trickle: false, stream, config: iceConfig });
    peer.on('signal', (signal) => {
      socket.emit('webrtc-answer', { targetSocketId: callerId, answer: signal });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  const toggleMic = () => {
    if (streamRef.current) {
      const newState = !micActive;
      streamRef.current.getAudioTracks()[0].enabled = newState;
      setMicActive(newState);
      socket.emit('toggle-audio', { movieId, userId: user.id, enabled: newState });
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const newState = !videoActive;
      streamRef.current.getVideoTracks()[0].enabled = newState;
      setVideoActive(newState);
      socket.emit('toggle-camera', { movieId, userId: user.id, enabled: newState });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const msgObj = {
      senderName: user.name,
      text: typedMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit('send-party-message', { movieId, message: msgObj });
    setMessages((prev) => [...prev, msgObj]);
    setTypedMessage('');
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
      {/* NAVIGATION BAR - Προσθήκη */}
      <div style={{ position: 'absolute', top: '10px', left: '20px', zIndex: 10, display: 'flex', gap: '15px' }}>
        <button onClick={() => window.history.back()} style={{ background: '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ArrowLeft size={16} /> {strings.goBack}
        </button>
        <button onClick={() => window.location.href = '/friends'} style={{ background: '#222', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Users size={16} /> {strings.friends}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', position: 'relative' }}>
        <video ref={videoPlayerRef} src={movieUrl} controls style={{ width: '95%', maxHeight: '85%', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />

        {!showChat && (
          <button onClick={() => setShowChat(true)} style={{ position: 'absolute', bottom: '30px', right: '30px', background: '#e50914', border: 'none', borderRadius: '50%', width: '55px', height: '55px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(229,9,20,0.4)', zIndex: 5 }} title={strings.openChat}>
            <MessageSquare size={24} />
          </button>
        )}
      </div>

      <div style={{ width: '240px', backgroundColor: '#0a0a0a', borderLeft: '1px solid #1a1a1a', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 2 }}>
        <h4 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', letterSpacing: '0.5px' }}>{strings.roomUsers}</h4>
        
        <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#111', border: videoActive ? '2px solid #e50914' : '2px solid #333' }}>
          {videoActive ? (
            <video ref={userVideoRef} muted autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: '2rem' }}>{user.avatar || '🍿'}</div>
          )}
          <span style={{ position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{strings.you}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
          {peers.map((peerObj) => <VideoCard key={peerObj.peerId} peerObj={peerObj} />)}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', paddingTop: '10px', borderTop: '1px solid #222' }}>
          <button onClick={toggleMic} style={{ background: micActive ? '#222' : '#e50914', color: '#fff', border: 'none', borderRadius: '50%', padding: '12px', cursor: 'pointer', transition: '0.2s' }}>
            {micActive ? <Mic size={18}/> : <MicOff size={18}/>}
          </button>
          <button onClick={toggleVideo} style={{ background: videoActive ? '#222' : '#e50914', color: '#fff', border: 'none', borderRadius: '50%', padding: '12px', cursor: 'pointer', transition: '0.2s' }}>
            {videoActive ? <Video size={18}/> : <VideoOff size={18}/>}
          </button>
        </div>
      </div>

      {showChat && (
        <div style={{ width: '320px', backgroundColor: '#111', borderLeft: '1px solid #222', display: 'flex', flexDirection: 'column', zIndex: 3 }}>
          <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', borderBottom: '1px solid #222', fontWeight: 'bold' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={18} color="#e50914"/> {strings.liveChat}</span>
            <X onClick={() => setShowChat(false)} style={{ cursor: 'pointer', color: '#aaa' }} size={20} title={strings.closeChat} />
          </div>
          
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.length === 0 ? (
              <div style={{ color: '#555', textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>{strings.noMessages}</div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} style={{ background: msg.senderName === user.name ? '#222' : '#1a1a1a', padding: '8px 12px', borderRadius: '8px', maxWidth: '85%', alignSelf: msg.senderName === user.name ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#e50914', fontWeight: 'bold' }}>{msg.senderName}</span>
                    <span style={{ fontSize: '0.65rem', color: '#666' }}>{msg.time}</span>
                  </div>
                  <p style={{ color: '#eee', margin: 0, fontSize: '0.9rem', wordBreak: 'break-word' }}>{msg.text}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ padding: '10px', borderTop: '1px solid #222', display: 'flex', gap: '8px' }}>
            <input type="text" value={typedMessage} onChange={(e) => setTypedMessage(e.target.value)} placeholder={strings.placeholder} style={{ flex: 1, backgroundColor: '#222', border: '1px solid #333', borderRadius: '20px', padding: '8px 15px', color: '#fff', fontSize: '0.9rem', outline: 'none' }} />
            <button type="submit" style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function VideoCard({ peerObj }) {
  const ref = useRef();
  useEffect(() => {
    peerObj.peer.on('stream', (stream) => { if (ref.current) ref.current.srcObject = stream; });
  }, [peerObj]);

  return (
    <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#111', border: '1px solid #252535' }}>
      {peerObj.isCameraOn ? (
        <video ref={ref} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: '1.8rem' }}>{peerObj.avatar || '🎬'}</div>
      )}
      <span style={{ position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{peerObj.username}</span>
    </div>
  );
}

export default WatchParty;