// PriceHub/Client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import './styles/Global.css'; // Global CSS ko import kiya

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* React Router ko wrap kiya pure application ke liye */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);