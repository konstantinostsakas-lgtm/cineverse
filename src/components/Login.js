import React, { useState } from 'react';
import { Film, LogIn, UserPlus, Lock, User } from 'lucide-react';

function Login({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false); // Εναλλαγή μεταξύ Login και Register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🔥');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const avatars = ['🔥', '🎬', '🍿', '🐉', '👾', '🚀', '🧙‍♂️', '🐱'];

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Παρακαλώ συμπληρώστε όλα τα πεδία.');
      return;
    }

    // Φορτώνουμε τη λίστα των εγγεγραμμένων χρηστών από το localStorage
    const storedUsers = JSON.parse(localStorage.getItem('cineverse_registered_users')) || [];

    if (isRegisterMode) {
      // --- ΛΕΙΤΟΥΡΓΙΑ REGISTER (ΕΓΓΡΑΦΗ) ---
      const userExists = storedUsers.some(u => u.name.toLowerCase() === username.toLowerCase());
      
      if (userExists) {
        setErrorMessage('Το όνομα χρήστη χρησιμοποιείται ήδη!');
        return;
      }

      // Δημιουργία νέου χρήστη
      const newUser = {
        id: `user_${Date.now()}`, // Μοναδικό ID βασισμένο στο χρόνο
        name: username,
        password: password, // Σε κανονική εφαρμογή εδώ μπαίνει hashing, για τις δοκιμές μας είναι text
        avatar: selectedAvatar,
        xp: 0,
        rank: 'Νεοσύλλεκτος Σινεφίλ'
      };

      // Αποθήκευση στη λίστα χρηστών
      storedUsers.push(newUser);
      localStorage.setItem('cineverse_registered_users', JSON.stringify(storedUsers));

      setSuccessMessage('Η εγγραφή έγινε επιτυχώς! Μπορείτε να συνδεθείτε.');
      setIsRegisterMode(false); // Γυρνάει αυτόματα στο Login screen
      setPassword(''); // Καθαρισμός κωδικού
    } else {
      // --- ΛΕΙΤΟΥΡΓΙΑ LOGIN (ΣΥΝΔΕΣΗ) ---
      // Αναζήτηση χρήστη με βάση το username και password
      const validUser = storedUsers.find(
        u => u.name.toLowerCase() === username.toLowerCase() && u.password === password
      );

      if (!validUser) {
        setErrorMessage('Λάθος όνομα χρήστη ή κωδικός πρόσβασης!');
        return;
      }

      // Σύνδεση επιτυχής: Αποθήκευση του ενεργού session
      localStorage.setItem('cineverse_user', JSON.stringify(validUser));
      onLoginSuccess(validUser);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#050508', color: '#fff', padding: '1rem' }}>
      <div style={{ backgroundColor: '#111', padding: '2.5rem', borderRadius: '12px', border: '1px solid #222', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Film size={36} style={{ color: '#e50914' }} />
          <span style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '1px' }}>CINEVERSE</span>
        </div>

        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>
          {isRegisterMode ? 'Δημιουργία Λογαριασμού' : 'Είσοδος Μέλους'}
        </h2>
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {isRegisterMode ? 'Γίνε μέλος του Championship και κέρδισε XP.' : 'Συνδέσου για να ξεκινήσεις τα Watch Parties.'}
        </p>

        {/* ΜΗΝΥΜΑΤΑ ΣΦΑΛΜΑΤΟΣ / ΕΠΙΤΥΧΙΑΣ */}
        {errorMessage && <div style={{ backgroundColor: 'rgba(229, 9, 20, 0.1)', color: '#e50914', border: '1px solid #e50914', padding: '0.6rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'left' }}>⚠️ {errorMessage}</div>}
        {successMessage && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', padding: '0.6rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'left' }}>✅ {successMessage}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* USERNAME INPUT */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>Όνομα Χρήστη</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', backgroundColor: '#1a1a24', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>Κωδικός Πρόσβασης</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', backgroundColor: '#1a1a24', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>
          </div>

          {/* AVATAR SELECTOR (ΜΟΝΟ ΣΤΟ REGISTER) */}
          {isRegisterMode && (
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>Επιλογή Avatar</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {avatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    style={{
                      fontSize: '1.6rem',
                      padding: '0.4rem',
                      backgroundColor: selectedAvatar === avatar ? '#e50914' : '#1a1a24',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            style={{ width: '100%', padding: '0.8rem', backgroundColor: isRegisterMode ? '#1e40af' : '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem', transition: 'background-color 0.2s' }}
          >
            {isRegisterMode ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isRegisterMode ? 'Δημιουργία Λογαριασμού' : 'Σύνδεση'}
          </button>

        </form>

        {/* SWITCH MODES LINK */}
        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#aaa' }}>
          {isRegisterMode ? 'Έχετε ήδη λογαριασμό;' : 'Δεν έχετε λογαριασμό;'}
          <button 
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage('');
              setSuccessMessage('');
            }}
            style={{ background: 'none', border: 'none', color: '#e50914', marginLeft: '5px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegisterMode ? 'Συνδεθείτε εδώ' : 'Εγγραφείτε τώρα'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default Login;