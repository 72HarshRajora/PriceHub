// PriceHub/Client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import Footer from './components/Footer'; // Abhi iski file banani hai

function App() {
  const location = useLocation();
  
  // State for client-side sorting: Low to High is default/initial state.
  const [isSortedLowToHigh, setIsSortedLowToHigh] = useState(true);

  // State to manage the loading indicator globally across the app
  const [isLoading, setIsLoading] = useState(false);

  // --- Sorting/Filtering Logic ---
  // This function is passed to the Header to be triggered by the filter toggle button
  const handleSortChange = () => {
    setIsSortedLowToHigh(prev => !prev);
  };
  
  // --- Loading Logic for UX ---
  // To show loading on the search page, we need to lift the state up.
  // The SearchResultsPage will call setIsLoading(true) before fetching 
  // and setIsLoading(false) after data is received.
  
  // Scroll to top on route change (like a single-page app should behave)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return (
    <>
      {/* Header component will be visible on all pages [cite: 18] */}
      <Header 
        handleSortChange={handleSortChange} 
        isSortedLowToHigh={isSortedLowToHigh}
        isLoading={isLoading} // Optional: Header mein loading state dikhaane ke liye
      />

      <main className="container main-content-area">
        <Routes>
          {/* Home Page Route [cite: 16] */}
          <Route path="/" element={<HomePage />} />
          
          {/* Search Results Page Route [cite: 30] 
              We pass the sorting state and the function to manage loading/UX.
          */}
          <Route 
            path="/search" 
            element={
              <SearchResultsPage 
                isSortedLowToHigh={isSortedLowToHigh}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
              />
            } 
          />

          {/* Placeholders for future pages [cite: 44, 48] */}
          <Route path="/deals" element={<h1 style={{marginTop: '100px'}}>Deals Page (Coming Soon)</h1>} />
          <Route path="/categories" element={<h1 style={{marginTop: '100px'}}>All Categories (Coming Soon)</h1>} />
          <Route path="/category/:name" element={<h1 style={{marginTop: '100px'}}>Category Page (Coming Soon)</h1>} />
          <Route path="/login" element={<h1 style={{marginTop: '100px'}}>Login Page (Coming Soon - Firebase Auth)</h1>} />
        </Routes>
      </main>
      
      {/* Footer component visible on all pages  */}
      <Footer />
    </>
  );
}

export default App;