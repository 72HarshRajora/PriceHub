// PriceHub/Client/src/components/Footer.jsx
import React from 'react';

function Footer() {
  return (
    <footer className="sticky-footer">
      <div className="container">
        <p>© {new Date().getFullYear()} PriceHub - The All-in-One Aggregator. </p>
        <p style={{ marginTop: '5px', fontSize: '0.8em' }}>
          <a href="/about" style={{ margin: '0 10px', color: 'var(--text-subtle)' }}>About Us</a> |
          <a href="/contact" style={{ margin: '0 10px', color: 'var(--text-subtle)' }}>Contact</a> |
          <a href="/privacy" style={{ margin: '0 10px', color: 'var(--text-subtle)' }}>Privacy Policy</a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;