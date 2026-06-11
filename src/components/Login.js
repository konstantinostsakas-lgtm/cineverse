import React, { useState, useEffect } from 'react';
import { Film, LogIn, UserPlus, Lock, User } from 'lucide-react';

// 🌐 ΤΟΠΙΚΟ ΛΕΞΙΚΟ ΜΕΤΑΦΡΑΣΕΩΝ (ΑΠΟΚΛΕΙΣΤΙΚΑ ΕΛΛΗΝΙΚΑ & ΑΓΓΛΙΚΑ)
const COMPONENT_STRINGS = {
  el: {
    titleRegister: "Δημιουργία Λογαριασμού",
    titleLogin: "Είσοδος Μέλους",
    subRegister: "Γίνε μέλος του Championship και κέρδισε XP.",
    subLogin: "Συνδέσου για να ξεκινήσεις τα Watch Parties.",
    emptyFieldsError: "Παρακαλώ συμπληρώστε όλα τα πεδία.",
    genericRegisterError: "Αποτυχία εγγραφής",
    genericLoginError: "Λάθος στοιχεία σύνδεσης",
    registerSuccess: "Η εγγραφή έγινε επιτυχώς! Μπορείτε να συνδεθείτε.",
    labelUsername: "Όνομα Χρήστη",
    labelPassword: "Κωδικός Πρόσβασης",
    labelAvatar: "Επιλογή Avatar",
    btnLoading: "Παρακαλώ περιμένετε...",
    btnRegister: "Δημιουργία Λογαριασμού",
    btnLogin: "Σύνδεση",
    switchTextRegister: "Έχετε ήδη λογαριασμό;",
    switchTextLogin: "Δεν έχετε λογαριασμό;",
    switchBtnRegister: "Συνδεθείτε εδώ",
    switchBtnLogin: "Εγγραφείτε τώρα",
    avatarFetchError: "Σφάλμα κατά την ανάκτηση των avatars:"
  },
  en: {
    titleRegister: "Create Account",
    titleLogin: "Member Login",
    subRegister: "Join the Championship and earn XP.",
    subLogin: "Log in to start Watch Parties.",
    emptyFieldsError: "Please fill in all fields.",
    genericRegisterError: "Registration failed",
    genericLoginError: "Incorrect login credentials",
    registerSuccess: "Registration successful! You can now log in.",
    labelUsername: "Username",
    labelPassword: "Password",
    labelAvatar: "Select Avatar",
    btnLoading: "Please wait...",
    btnRegister: "Create Account",
    btnLogin: "Log In",
    switchTextRegister: "Already have an account?",
    switchTextLogin: "Don't have an account?",
    switchBtnRegister: "Log in here",
    switchBtnLogin: "Register now",
    avatarFetchError: "Error fetching avatars:"
  }
};

function Login({ onLoginSuccess, currentLang = 'el' }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatars, setAvatars] = useState([]); 
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🌍 Επιλογή της σωστής γλώσσας
  const localLang = currentLang === 'en' ? 'en' : 'el';
  const strings = COMPONENT_STRINGS[localLang];

  // Ανάκτηση των πραγματικών διαθέσιμων avatars από το backend κατά το mount
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        // ✨ ΔΙΟΡΘΩΣΗ: Καθαρό HTTPS URL χωρίς θύρα :5000
        const response = await fetch('https://cineverse-backend-vmof.onrender.com/api/avatars');
        if (response.ok) {
          const data = await response.json();
          setAvatars(data.avatars || []);
          if (data.avatars && data.avatars.length > 0) {
            setSelectedAvatar(data.avatars[0]);
          }
        }
      } catch (error) {
        console.error(strings.avatarFetchError, error);
        setSelectedAvatar('');
      }
    };
    fetchAvatars();
  }, [strings.avatarFetchError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage(strings.emptyFieldsError);
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // --- ΠΡΑΓΜΑΤΙΚΟ REGISTER ΣΤΟ BACKEND ---
        // ✨ ΔΙΟΡΘΩΣΗ: Καθαρό HTTPS URL χωρίς θύρα :5000
        const response = await fetch('https://cineverse-backend-vmof.onrender.com/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, avatar: selectedAvatar })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || strings.genericRegisterError);
        }

        setSuccessMessage(strings.registerSuccess);
        setIsRegisterMode(false); // Γυρνάει αυτόματα στο Login
        setPassword('');
      } else {
        // --- ΠΡΑΓΜΑΤΙΚΟ LOGIN ΣΤΟ BACKEND ---
        // ✨ ΔΙΟΡΘΩΣΗ: Καθαρό HTTPS URL χωρίς θύρα :5000
        const response = await fetch('https://cineverse-backend-vmof.onrender.com/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || strings.genericLoginError);
        }

        // Αποθήκευση των πραγματικών στοιχείων από τη MySQL
        localStorage.setItem('cineverse_token', data.token);
        localStorage.setItem('cineverse_user', JSON.stringify(data.user));
        
        onLoginSuccess(data.user);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      isLoading(false);
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
          {isRegisterMode ? strings.titleRegister : strings.titleLogin}
        </h2>
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {isRegisterMode ? strings.subRegister : strings.subLogin}
        </p>

        {errorMessage && <div style={{ backgroundColor: 'rgba(229, 9, 20, 0.1)', color: '#e50914', border: '1px solid #e50914', padding: '0.6rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'left' }}>⚠️ {errorMessage}</div>}
        {successMessage && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', padding: '0.6rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'left' }}>✅ {successMessage}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>{strings.labelUsername}</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input 
                type="text" 
                placeholder={strings.labelUsername} 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
                style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', backgroundColor: '#1a1a24', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>{strings.labelPassword}</label>
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

          {/* Real-time εμφάνιση των Avatars από τη βάση δεδομένων */}
          {isRegisterMode && avatars.length > 0 && (
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 600 }}>{strings.labelAvatar}</label>
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
            {isLoading ? strings.btnLoading : (isRegisterMode ? strings.btnRegister : strings.btnLogin)}
          </button>

        </form>

        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#aaa' }}>
          {isRegisterMode ? strings.switchTextRegister : strings.switchTextLogin}
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
            {isRegisterMode ? strings.switchBtnRegister : strings.switchBtnLogin}
          </button>
        </div>

      </div>
    </div>
  );
}

export default Login;