import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css'; // Εισαγωγή των καθολικών cinematic και accessibility styles

// Αρχικοποίηση του root element απευθείας από το live DOM
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);