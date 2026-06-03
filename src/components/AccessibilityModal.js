import React from 'react';
import { X, Eye, Type, Contrast } from 'lucide-react'; // Εικονίδια για εύκολη αναγνώριση των ρυθμίσεων (HCI Recognition over Recall)

function AccessibilityModal({ 
  onClose, 
  contrastMode, 
  setContrastMode, 
  colorBlindness, 
  setColorBlindness, 
  fontSize, 
  setFontSize 
}) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="accessibility-title">
      {/* Σταματάμε το bubbling για να μην κλείνει το modal όταν κάνουμε κλικ μέσα του */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Επικεφαλίδα και Κουμπί Κλεισίματος */}
        <div className="modal-header">
          <h2 id="accessibility-title" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            Προτιμήσεις Προσβασιμότητας
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Κλείσιμο παραθύρου">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* 1. Ρύθμιση Αντίθεσης (High Contrast) - HCI: Βελτίωση αναγνωσιμότητας για χαμηλή όραση */}
          <div className="setting-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Contrast size={18} />
              <span>Λειτουργία Αντίθεσης</span>
            </div>
            <div className="btn-grid">
              <button 
                className={`settings-btn ${contrastMode === 'normal' ? 'active' : ''}`}
                onClick={() => setContrastMode('normal')}
              >
                Κανονική (Dark Theme)
              </button>
              <button 
                className={`settings-btn ${contrastMode === 'high-contrast' ? 'active' : ''}`}
                onClick={() => setContrastMode('high-contrast')}
                style={{ backgroundColor: '#000', color: '#fff', border: contrastMode === 'high-contrast' ? '2px solid #ff0000' : '1px solid #444' }}
              >
                Υψηλή Αντίθεση (WCAG)
              </button>
            </div>
          </div>

          {/* 2. Μεγέθυνση Γραμματοσειράς (Text Scaling) */}
          <div className="setting-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Type size={18} />
              <span>Μέγεθος Κειμένου</span>
            </div>
            {/* ΔΙΟΡΘΩΣΗ: Μετατροπή σε camelCase -> gridTemplateColumns αντί για gridTemplate-columns */}
            <div className="btn-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <button 
                className={`settings-btn ${fontSize === 1 ? 'active' : ''}`}
                onClick={() => setFontSize(1)}
              >
                100%
              </button>
              <button 
                className={`settings-btn ${fontSize === 1.2 ? 'active' : ''}`}
                onClick={() => setFontSize(1.2)}
              >
                120%
              </button>
              <button 
                className={`settings-btn ${fontSize === 1.4 ? 'active' : ''}`}
                onClick={() => setFontSize(1.4)}
              >
                140%
              </button>
            </div>
          </div>

          {/* 3. Φίλτρα Αχρωματοψίας (Color Blindness Simulation Filters) */}
          <div className="setting-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Eye size={18} />
              <span>Φίλτρα Χρωματικής Μείωσης (Αχρωματοψία)</span>
            </div>
            <div className="btn-grid">
              <button 
                className={`settings-btn ${colorBlindness === 'none' ? 'active' : ''}`}
                onClick={() => setColorBlindness('none')}
              >
                Κανένα Φίλτρο
              </button>
              <button 
                className={`settings-btn ${colorBlindness === 'protanopia' ? 'active' : ''}`}
                onClick={() => setColorBlindness('protanopia')}
              >
                Πρωτανωπία (Κόκκινο)
              </button>
              <button 
                className={`settings-btn ${colorBlindness === 'deuteranopia' ? 'active' : ''}`}
                onClick={() => setColorBlindness('deuteranopia')}
              >
                Δευτερανωπία (Πράσινο)
              </button>
              <button 
                className={`settings-btn ${colorBlindness === 'tritanopia' ? 'active' : ''}`}
                onClick={() => setColorBlindness('tritanopia')}
              >
                Τριτανωπία (Μπλε)
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AccessibilityModal;