// PriceHub/Client/src/pages/SearchResultsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import ProductsSection from '../components/ProductsSection';
import '../styles/SearchResultsPage.css'; // Filter bar styling ke liye
import { FaTruckLoading, FaSearch, FaExclamationTriangle } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000/api';

function SearchResultsPage({ isSortedLowToHigh, setIsLoading, isLoading }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const query = queryParams.get('name');
  const platforms = queryParams.get('platforms');

  const [products, setProducts] = useState([]);
  const [initialProducts, setInitialProducts] = useState([]);
  const [error, setError] = useState(null);

  // --- Sorting Logic ---
  // isSortedLowToHigh prop App.jsx se aati hai (Header filter se control hoti hai)
  const sortProducts = useCallback((data, isLowToHigh) => {
    // Note: Data already interleaved (1, 2, 3, 4...) order mein aata hai. 
    // Sort karne se yeh interleaving break ho jayegi, jo ki filter ka maksad hai.
    const sorted = [...data].sort((a, b) => {
      // Assuming a.price and b.price are already cleaned numbers from the backend
      if (isLowToHigh) {
        return a.price - b.price; // Low to High (Ascending)
      } else {
        return b.price - a.price; // High to Low (Descending)
      }
    });
    setProducts(sorted);
  }, []);
  
  // --- Data Fetching Logic ---
  useEffect(() => {
    if (!query || !platforms) {
      setError("No valid search query or platforms selected.");
      return;
    }
    
    // Clear previous results and start loading
    setProducts([]);
    setInitialProducts([]);
    setError(null);
    setIsLoading(true);

    const fetchProducts = async () => {
      try {
        console.log(`API Call: ${API_BASE_URL}/search?q=${query}&platforms=${platforms}`);
        
        // Backend sequentially scrapes two sites, saves to MongoDB, and returns interleaved data
        const response = await axios.get(`${API_BASE_URL}/search?q=${query}&platforms=${platforms}`);
        
        // Initial state is the interleaved data from backend (Default sequence)
        setInitialProducts(response.data); 
        
        // Immediately apply the current sort order
        sortProducts(response.data, isSortedLowToHigh);

      } catch (err) {
        console.error("Search API failed:", err);
        setError("Failed to fetch search results. Server or scraping issue.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [query, platforms, setIsLoading, sortProducts]); // Re-fetch on query or platform change

  // --- Apply Sorting when the toggle button is clicked (isSortedLowToHigh changes) ---
  useEffect(() => {
    // Only sort the current list (which is either the initial interleaved list or an already sorted list)
    if (initialProducts.length > 0) {
        sortProducts(initialProducts, isSortedLowToHigh);
    }
  }, [isSortedLowToHigh, initialProducts, sortProducts]);


  // --- Render Functions ---
  const renderStatus = () => {
    if (isLoading) {
      return (
        <div className="status-message loading-message">
          <div className="custom-spinner"></div>
          {/* Informative English message to manage user expectations */}
          <p style={{marginTop: '20px'}}>
             <FaTruckLoading style={{ marginRight: '8px' }} />
             Fetching live prices for "{query}" from {platforms.split(',').join(' and ')}. Please hold on!
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="status-message error-message">
          <FaExclamationTriangle style={{ marginRight: '8px' }} />
          Error: {error}
        </div>
      );
    }

    if (products.length === 0 && !isLoading) {
      return (
        <div className="status-message no-results-message">
          <FaSearch style={{ marginRight: '8px' }} />
          Sorry, no products found for "{query}" on the selected platforms.
        </div>
      );
    }
    
    return null;
  };
  
  // Filter bar data
  const [platform1Name, platform2Name] = platforms ? platforms.split(',').map(p => p.charAt(0).toUpperCase() + p.slice(1)) : ['', ''];

  return (
    <div className="search-results-page">
      <div className="search-page-layout container">
        
        {/* 1. Filters Sidebar */}
        <aside className="filters-sidebar">
          <h2 className="filters-title">Filters</h2>
          
          {/* Platform Filters (Placeholder) */}
          <div className="filter-group">
            <h3>Platforms</h3>
            <p className="platform-tag selected-platform">{platform1Name}</p>
            <p className="platform-tag selected-platform">{platform2Name}</p>
            <p className="platform-note">Filtering based on selection in header.</p>
          </div>
          
          {/* Price Sorting (Live Filter is on Header, but shown here too) */}
          <div className="filter-group">
            <h3>Sorting Options</h3>
            <p>Current Sort: <strong>Price ({isSortedLowToHigh ? 'Low → High' : 'High → Low'})</strong></p>
            <p className="platform-note">Filter is live, triggered by the toggle in the header.</p>
          </div>

          {/* Other Filter Placeholders */}
          <div className="filter-group">
            <h3>Price Range (Future)</h3>
            <p className="platform-note">Min-Max Slider functionality coming soon.</p>
          </div>
          <div className="filter-group">
            <h3>Category (Future)</h3>
            <p className="platform-note">Side filters to refine search within fetched results.</p>
          </div>

        </aside>

        {/* 2. Main Content Area */}
        <div className="main-results-area">
          <h1 className="results-heading">
            Results for: **{query}** ({products.length} Items Found)
          </h1>
          <p className="data-note">
             Showing interleaved results from {platform1Name} and {platform2Name}.
          </p>
          
          {/* Render Loading, Error, or No Results Message */}
          {renderStatus()}
          
          {/* Render Product Grid */}
          {!isLoading && products.length > 0 && (
            <ProductsSection 
              title="Product Comparison"
              products={products}
              isGrid={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchResultsPage;