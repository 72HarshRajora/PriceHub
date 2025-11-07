// PriceHub/Client/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import ProductsSection from '../components/ProductsSection';
import axios from 'axios';
import { FaBolt, FaStar, FaInfoCircle } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000/api';

function HomePage() {
  const [homeData, setHomeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching Logic for Home Page ---
  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch data from the optimized home endpoint 
        // (which calls only one random platform for efficiency)
        const response = await axios.get(`${API_BASE_URL}/products/home`);
        setHomeData(response.data);
      } catch (err) {
        console.error("Home page data fetch failed:", err);
        setError("Failed to load trending products. Please check server connection.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

  // --- Styling: Hero Section (using inline styles for theme) ---
  const heroStyle = {
    padding: '80px 0',
    marginBottom: '40px',
    textAlign: 'center',
    // Premium dark blue and purple gradient theme 
    background: 'linear-gradient(135deg, var(--primary-dark) 0%, #3a1c71 50%, var(--accent-purple) 100%)', 
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
    color: 'var(--text-light)',
  };

  const heroTitleStyle = {
    fontSize: '3.5em',
    marginBottom: '10px',
    color: 'var(--text-light)',
    textShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
  };

  const heroSubtitleStyle = {
    fontSize: '1.2em',
    color: 'var(--light-purple)',
  };
  
  // --- Loading/Error UI ---
  const renderStatus = () => {
    if (isLoading) {
      // Custom CSS Spinner [cite: 39]
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className="custom-spinner"></div>
          <p style={{ marginTop: '20px', color: 'var(--light-purple)' }}>
            <FaBolt style={{ marginRight: '8px' }} />
            Fetching ultra-fast deals for you... Please wait. [cite: 39]
          </p>
        </div>
      );
    }
    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '50px', color: '#ff6b6b' }}>
          <FaInfoCircle style={{ marginRight: '8px' }} />
          {error}
        </div>
      );
    }
    if (homeData.length === 0 && !isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-subtle)' }}>
          <FaInfoCircle style={{ marginRight: '8px' }} />
          No products loaded for the homepage right now.
        </div>
      );
    }
    return null;
  };
  

  return (
    <div className="home-page">
      {/* 1. Hero Section */}
      <section className="hero-section" style={heroStyle}>
        <h1 style={heroTitleStyle}>PriceHub: Shop Smart, Save Big</h1>
        <p style={heroSubtitleStyle}>
          Compare live prices from Flipkart, Meesho, Myntra, and more!
        </p>
      </section>

      {/* 2. Products Content Area */}
      {renderStatus() || (
        <div className="products-list-area">
          {/* Display 6 Rows of Random Category Items */}
          {homeData.map((section, index) => (
            <ProductsSection
              key={index}
              // Category name ko capitalize karke title banaya
              title={`🔥 Top 5 Cheapest ${section.category.charAt(0).toUpperCase() + section.category.slice(1)} (Source: ${section.platform})`} 
              products={section.products}
              isGrid={false} // Rows mein dikhaane ke liye
            />
          ))}

          {/* 3. Placeholder Sections for Future Features [cite: 27, 28] */}
          <section style={{ padding: '20px 0', margin: '40px 0', textAlign: 'center', borderTop: '1px solid var(--secondary-dark)' }}>
             <h2 style={heroSubtitleStyle}><FaStar style={{ color: 'gold' }} /> Top Rated / AI Recommendations (Coming Soon)</h2>
             <p style={{ color: 'var(--text-subtle)', fontSize: '0.9em' }}>
                Login feature ke baad, hum aapki search history use karke personalized recommendations denge.
             </p>
          </section>
        </div>
      )}
    </div>
  );
}

export default HomePage;