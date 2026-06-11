import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, Users, Search } from 'lucide-react';

// 🌐 ΤΟΠΙΚΟ ΛΕΞΙΚΟ ΜΕΤΑΦΡΑΣΕΩΝ (ΑΠΟΚΛΕΙΣΤΙΚΑ ΕΛΛΗΝΙΚΑ & ΑΓΓΛΙΚΑ)
const COMPONENT_STRINGS = {
  el: {
    panelTitle: "Κοινότητα & Φίλοι",
    searchPlaceholder: "Προσθήκη φίλου (γράψε username)...",
    addBtn: "Προσθήκη",
    pendingTitle: "Αιτήματα Φιλίας",
    acceptTitle: "Αποδοχή",
    rejectTitle: "Απόρριψη",
    friendsTitle: "Οι Φίλοι μου",
    noFriends: "Δεν έχεις προσθέσει φίλους ακόμα.",
    inviteBtn: "🎬 Πρόσκληση",
    requestSent: "✅ Το αίτημα στάλθηκε!",
    inviteSent: "🎬 Η πρόσκληση στάλθηκε live στον",
    errorLoading: "Σφάλμα φόρτωσης δεδομένων φίλων:"
  },
  en: {
    panelTitle: "Community & Friends",
    searchPlaceholder: "Add friend (type username)...",
    addBtn: "Add",
    pendingTitle: "Friend Requests",
    acceptTitle: "Accept",
    rejectTitle: "Reject",
    friendsTitle: "My Friends",
    noFriends: "You haven't added any friends yet.",
    inviteBtn: "🎬 Invite",
    requestSent: "✅ Request sent!",
    inviteSent: "🎬 Invitation sent live to",
    errorLoading: "Error loading friends data:"
  }
};

function FriendsPanel({ currentUserId, socket, currentLang = 'el' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [message, setMessage] = useState('');

  // 🌍 Επιλογή της σωστής γλώσσας
  const localLang = currentLang === 'en' ? 'en' : 'el';
  const strings = COMPONENT_STRINGS[localLang];

  // Φόρτωση πραγματικών δεδομένων από το API
  const fetchFriendsData = async () => {
    if (!currentUserId || currentUserId === 'guest') return;
    try {
      // Φόρτωση Λίστας Φίλων
     const friendsRes = await fetch(`http://localhost:5000/api/friends/list/${currentUserId}`);
      const friendsData = await friendsRes.json();
      setFriends(friendsData);

      // Φόρτωση Εκκρεμών Αιτημάτων
      const pendingRes = await fetch(`http://localhost:5000/api/friends/pending/${currentUserId}`);
      const pendingData = await pendingRes.json();
      setPendingRequests(pendingData);
    } catch (err) {
      console.error(strings.errorLoading, err);
    }
  };

  useEffect(() => {
    fetchFriendsData();

    // Ακρόαση WebSocket για real-time Friend Requests
    if (socket) {
      socket.emit('join-user-room', currentUserId);
      socket.on('new-friend-request', () => {
        fetchFriendsData();
      });
    }

    return () => {
      if (socket) socket.off('new-friend-request');
    };
  }, [currentUserId, socket]);

  // Αναζήτηση χρηστών live με Debounce
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
       const res = await fetch(`http://localhost:5000/api/users/search?q=${searchQuery}&currentUserId=${currentUserId}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      }
    };
    const delayDebounce = setTimeout(() => searchUsers(), 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, currentUserId]);

  // Αποστολή αιτήματος φιλίας στο API
  const sendFriendRequest = async (receiverId) => {
    try {
      const res = await fetch('http://http://localhost:5000:5000/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUserId, receiverId })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(strings.requestSent);
        setSearchQuery('');
        setSearchResults([]);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`⚠️ ${data.error}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Απάντηση σε αίτημα (Accept / Reject) στο API
  const handleRespond = async (friendshipId, action) => {
    try {
      await fetch('http://http://localhost:5000:5000/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action })
      });
      fetchFriendsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Πραγματική αποστολή πρόσκλησης Watch Party μέσω WebSockets
  const handleInviteToWatchParty = (friendId, friendUsername) => {
    if (socket && currentUserId) {
      socket.emit('send-watch-party-invite', {
        senderId: currentUserId,
        receiverId: friendId
      });
      setMessage(`${strings.inviteSent} ${friendUsername}!`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div style={{ backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222', padding: '1.5rem', color: '#fff', width: '100%' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem', marginBottom: '1.2rem', color: '#e50914' }}>
        <Users size={22} /> {strings.panelTitle}
      </h3>

      {message && <div style={{ fontSize: '0.85rem', marginBottom: '0.8rem', padding: '0.4rem', backgroundColor: '#222', borderRadius: '4px' }}>{message}</div>}

      {/* 🔍 ΑΝΑΖΗΤΗΣΗ ΝΕΩΝ ΦΙΛΩΝ */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
        <input 
          type="text" 
          placeholder={strings.searchPlaceholder} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.2rem', backgroundColor: '#1a1a24', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
        />
        
        {/* Dropdown Αποτελεσμάτων Αναζήτησης */}
        {searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: '#16161f', border: '1px solid #333', borderRadius: '6px', marginTop: '4px', zIndex: 10, overflow: 'hidden' }}>
            {searchResults.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{u.avatar}</span>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{u.username}</span>
                </div>
                <button 
                  onClick={() => sendFriendRequest(u.id)}
                  style={{ backgroundColor: '#e50914', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                >
                  <UserPlus size={14} /> {strings.addBtn}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📩 ΕΚΚΡΕΜΗ ΑΙΤΗΜΑΤΑ (PENDING) */}
      {pendingRequests.length > 0 && (
        <div style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(229,9,20,0.05)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(229,9,20,0.2)' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#e50914', marginBottom: '0.6rem', fontWeight: 'bold' }}>{strings.pendingTitle} ({pendingRequests.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingRequests.map(req => (
              <div key={req.friendshipId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{req.avatar}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{req.username}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => handleRespond(req.friendshipId, 'accept')} style={{ backgroundColor: '#22c55e', border: 'none', color: '#fff', padding: '4px', borderRadius: '4px', cursor: 'pointer' }} title={strings.acceptTitle}><Check size={14} /></button>
                  <button onClick={() => handleRespond(req.friendshipId, 'reject')} style={{ backgroundColor: '#ef4444', border: 'none', color: '#fff', padding: '4px', borderRadius: '4px', cursor: 'pointer' }} title={strings.rejectTitle}><X size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🟢 ΛΙΣΤΑ ΦΙΛΩΝ (ONLINE/READY FOR WATCH PARTY) */}
      <div>
        <h4 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.8rem', fontWeight: 'bold' }}>{strings.friendsTitle} ({friends.length})</h4>
        {friends.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#555', fontSize: '0.85rem', padding: '1rem 0' }}>{strings.noFriends}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {friends.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#16161f', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ fontSize: '1.6rem' }}>{f.avatar}</span>
                    <span style={{ position: 'absolute', bottom: 2, right: 2, width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid #16161f' }}></span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{f.username}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{f.rank}</div>
                  </div>
                </div>
                
                {/* Πραγματική κλήση μεμονωμένης πρόσκλησης */}
                <button 
                  onClick={() => handleInviteToWatchParty(f.id, f.username)}
                  style={{ backgroundColor: 'transparent', border: '1px solid #333', color: '#ffd700', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {strings.inviteBtn}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendsPanel;