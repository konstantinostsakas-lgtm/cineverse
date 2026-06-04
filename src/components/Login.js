import React, { useState } from 'react';
import { Film, LogIn, UserPlus, Lock, User } from 'lucide-react';

function Login({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🔥');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const avatars = ['🔥', '🎬', '🍿', '🐉', '👾', '🚀', '🧙‍♂️', '🐱'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Παρακαλώ συμπληρώστε όλα τα πεδία.');
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // --- ΠΡΑΓΜΑΤΙΚΟ REGISTER ΣΤΟ BACKEND ---
        const response = await fetch('http://localhost:5000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, avatar: selectedAvatar })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Αποτυχία εγγραφής');
        }

        setSuccessMessage('Η εγγραφή έγινε επιτυχώς! Μπορείτε να συνδεθείτε.');
        setIsRegisterMode(false); // Γυρνάει αυτόματα στο Login
        setPassword('');
      } else {
        // --- ΠΡΑΓΜΑΤΙΚΟ LOGIN ΣΤΟ BACKEND ---
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Λάθος στοιχεία σύνδεσης');
        }

        // Αποθηκεύουμε το token και τα στοιχεία του χρήστη που ήρθαν από τη MySQL
        localStorage.setItem('cineverse_token', data.token);
        localStorage.setItem('cineverse_user', JSON.stringify(data.user));
        
        onLoginSuccess(data.user);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: '#fff', padding: '1rem' }}>
      <div style={{ backgroundColor: '#111', padding: '2.5rem', borderRadius: '12px', border: '1px solid #222', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
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

        {errorMessage && <div style={{ backgroundColor: 'rgba(229, 9, 20, 0.1)', color: '#e50914', border: '1px solid #e50914', padding: '0.6rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'left' }}>⚠️ {errorMessage}</div>}
        {successMessage && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', padding: '0.6rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'left' }}>✅ {successMessage}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>Όνομα Χρήστη</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
                style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', backgroundColor: '#1a1a24', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>Κωδικός Πρόσβασης</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', backgroundColor: '#1a1a24', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>
          </div>

          {isRegisterMode && (
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>Επιλογή Avatar</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {avatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    disabled={isLoading}
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

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', padding: '0.8rem', backgroundColor: isRegisterMode ? '#1e40af' : '#e50914', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}
          >
            {isRegisterMode ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isLoading ? 'Παρακαλώ περιμένετε...' : isRegisterMode ? 'Δημιουργία Λογαριασμού' : 'Σύνδεση'}
          </button>

        </form>

        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#aaa' }}>
          {isRegisterMode ? 'Έχετε ήδη λογαριασμό;' : 'Δεν έχετε λογαριασμό;'}
          <button 
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage('');
              setSuccessMessage('');
            }}
            disabled={isLoading}
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