// PriceHub/Client/src/components/Header/Header.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa'; 
import './Header.css';

const API_BASE_URL = 'http://localhost:5000/api';
const PLATFORMS = [
  { id: 'amazon', name: 'Amazon' },
  { id: 'flipkart', name: 'Flipkart' },
  { id: 'meesho', name: 'Meesho' },
  { id: 'myntra', name: 'Myntra' },
];

// Prop 'onHomeClick' is used here to reset parent state when navigating home.
function Header({ handleSortChange, isSortedLowToHigh, onHomeClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSearchPage = location.pathname === '/search';
  const queryParams = new URLSearchParams(location.search);
  
  // States initialized based on current URL query params
  const [query, setQuery] = useState(queryParams.get('name') || '');
  const [platform1, setPlatform1] = useState(queryParams.get('platforms')?.split(',')[0] || 'amazon');
  const [platform2, setPlatform2] = useState(queryParams.get('platforms')?.split(',')[1] || 'flipkart');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  // --- Data Fetching: Recent Searches ---
  useEffect(() => {
    // Fetch history once on load
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/user/history`);
        setRecentSearches(response.data); 
      } catch (error) {
        console.error("Failed to fetch search history:", error);
      }
    };

    fetchHistory();
  }, []);

  // --- Core Search Execution Logic ---
  const executeSearch = (searchQuery) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery || platform1 === platform2) {
      if(trimmedQuery !== '') alert('Please select two different platforms.');
      return; 
    }
    
    // Final navigation and API call trigger
    const platformsParam = `${platform1},${platform2}`;
    navigate(`/search?name=${encodeURIComponent(trimmedQuery)}&platforms=${platformsParam}`);
  };
  
  // Triggered by button click or Enter key
  const handleSearchClick = () => {
      executeSearch(query);
      setIsHistoryVisible(false); // Search karne ke baad history hide
  }

  const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
          handleSearchClick();
      }
  }
  
  // --- Input Change Handlers ---
  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setIsHistoryVisible(true); // Show history when typing
  };

  const handlePlatform1Change = (e) => {
    setPlatform1(e.target.value);
  }

  const handlePlatform2Change = (e) => {
    setPlatform2(e.target.value);
  }

  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery);
    setIsHistoryVisible(false); // Hide history after selecting
    executeSearch(historyQuery); // Immediate search execution
  }
  
  // --- Home Navigation Logic (Resetting state) ---
  const handleHomeClick = () => {
    // Parent component App.jsx ko notify karna
    if(onHomeClick) {
      onHomeClick();
    }
    // Search bar state ko reset karna
    setQuery('');
    setPlatform1('amazon');
    setPlatform2('flipkart');
  }
  
  // --- Filter Logic ---
  const handleFilterToggle = () => {
    if (handleSortChange) {
      handleSortChange();
    }
  };
  
  const sortIcon = isSortedLowToHigh ? '↑' : '↓';
  const sortText = isSortedLowToHigh ? 'Low' : 'High';
  
  return (
    <header className="main-header">
      <div className="header-container container">
        {/* --- Logo (Left) --- */}
        <Link to="/" className="header-logo" onClick={handleHomeClick}>
          PriceHub
        </Link>
        
        {/* --- Search Widget (Center) --- */}
        <div className="search-widget">
          <div className="select-group">
            {/* Platform 1 Select */}
            <select value={platform1} onChange={handlePlatform1Change} className="platform-select">
              {PLATFORMS.map(p => (
                <option key={p.id} value={p.id} disabled={p.id === platform2}>
                  {p.name}
                </option>
              ))}
            </select>
            
            {/* Platform 2 Select */}
            <select value={platform2} onChange={handlePlatform2Change} className="platform-select">
              {PLATFORMS.map(p => (
                <option key={p.id} value={p.id} disabled={p.id === platform1}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="search-input-container">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyPress={handleKeyPress}
              onBlur={() => setTimeout(() => setIsHistoryVisible(false), 200)} 
              onFocus={() => setIsHistoryVisible(true)}
              placeholder="Search products (e.g., mobile, shoes)..."
              className="search-input"
            />
            
            {/* Search Button */}
            <button className="search-button" onClick={handleSearchClick}>
                <FaSearch />
            </button>
            
            {/* Recent Search History Dropdown */}
            {isHistoryVisible && query.length > 0 && recentSearches.length > 0 && (
              <ul className="search-history-dropdown">
                <li className="history-title">Recent Searches:</li>
                {recentSearches.map((historyQuery) => (
                  <li 
                    key={historyQuery} 
                    onMouseDown={() => handleHistoryClick(historyQuery)}
                  >
                    {historyQuery}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* --- Navigation and Login (Right) --- */}
        <nav className="header-nav">
          <div 
            className="nav-link-dropdown"
            onMouseEnter={() => setIsDrawerOpen(true)}
            onMouseLeave={() => setIsDrawerOpen(false)}
          >
            <Link to="/categories" className="nav-link">Categories</Link>
            {/* Categories Drawer */}
            {isDrawerOpen && (
              <div className="categories-drawer">
                <Link to="/category/electronic" className="drawer-link">Electronic</Link>
                <Link to="/category/mobile" className="drawer-link">Mobile Phone</Link>
                <Link to="/category/laptop" className="drawer-link">Laptop</Link>
                <Link to="/category/headphone" className="drawer-link">Headphone</Link>
                <Link to="/category/earphone" className="drawer-link">Earphone</Link>
              </div>
            )}
          </div>
          <Link to="/" className="nav-link" onClick={handleHomeClick}>Home</Link>
          <Link to="/deals" className="nav-link">Deals</Link>
          <Link to="/login" className="login-button">
            Login
          </Link>
        </nav>
      </div>

      {/* --- Filter Toggle Button (Visible only on Search Page) --- */}
      {isSearchPage && (
        <div className="filter-bar container">
          <button 
            onClick={handleFilterToggle} 
            className="filter-toggle-button"
            title={`Toggle Price Sort: ${isSortedLowToHigh ? 'Low to High' : 'High to Low'}`}
          >
            Price: {sortText} <span className="swap-icon">| {sortIcon} |</span> Price: {isSortedLowToHigh ? 'High' : 'Low'}
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;