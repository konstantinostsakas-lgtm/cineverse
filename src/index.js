import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css'; // Εισαγωγή των καθολικών cinematic και accessibility styles

// Δημιουργία του root element και σύνδεση με το DOM του index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);