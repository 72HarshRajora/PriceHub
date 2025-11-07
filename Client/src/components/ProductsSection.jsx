// PriceHub/Client/src/components/ProductsSection.jsx
import React from 'react';
import ProductCard from './ProductCard';

function ProductsSection({ title, products = [], isGrid = false }) {
  if (!products || products.length === 0) {
    return null;
  }

  // Component Level Styling
  const sectionStyle = {
    padding: '20px 0',
    borderTop: isGrid ? 'none' : '1px solid var(--secondary-dark)',
    marginBottom: isGrid ? '20px' : '0',
  };

  const titleStyle = {
    color: 'var(--light-purple)',
    marginBottom: '20px',
    borderBottom: '2px solid rgba(156, 39, 176, 0.2)',
    paddingBottom: '10px',
    fontSize: isGrid ? '2em' : '1.5em',
  };

  const gridContainerStyle = {
    display: 'grid',
    // Grid layout for search page
    gridTemplateColumns: isGrid ? 'repeat(auto-fill, minmax(250px, 1fr))' : 'repeat(5, minmax(200px, 1fr))',
    gap: '20px',
    // Home Page par row horizontal scrollable hogi (5 columns per row)
    overflowX: isGrid ? 'auto' : 'scroll',
    paddingBottom: isGrid ? '0' : '20px',
    
    // Hide scrollbar on home page for a cleaner look
    ...(isGrid ? {} : { 
        whiteSpace: 'nowrap',
        '& > div': { display: 'inline-block', width: '200px', marginRight: '20px' }
    })
  };
    
  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>{title}</h2>
      
      {/* Product Cards Grid/Row */}
      <div 
        className={isGrid ? "product-grid-container" : "product-row-container"}
        style={gridContainerStyle}
      >
        {products.map((product, index) => (
          // Har product ko ek unique key deni hai
          <ProductCard key={product.id || index} product={product} />
        ))}
      </div>
    </section>
  );
}

// Global Grid/Row styles ke liye, hum isko Global.css mein add nahi kar rahe, 
// balki iski basic functionality component mein hi rakhi hai.

export default ProductsSection;