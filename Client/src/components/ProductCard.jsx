// PriceHub/Client/src/components/ProductCard.jsx
import React from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa'; // Ek accha icon daalte hain
import './ProductCard.css';

function ProductCard({ product }) {
  // Check karte hain ki product data available hai ya nahi
  if (!product || !product.name || !product.price) {
    return null;
  }

  // Price ko Indian Rupee format mein show karte hain
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);
    
  return (
    <div className="product-card">
      <div className="card-image-container">
        <img 
          src={product.image} 
          alt={product.name} 
          className="product-image"
          // Agar image load na ho toh ek default image dikhegi
          onError={(e) => { e.target.onerror = null; e.target.src="/placeholder.png" }} 
        />
        <span className={`platform-badge ${product.platform.toLowerCase()}`}>
          {product.platform}
        </span>
      </div>
      <div className="card-info">
        <h3 className="product-name" title={product.name}>
          {product.name}
        </h3>
        <p className="product-price">{formattedPrice}</p>
        <a 
          href={product.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="product-link"
          title={`Go to ${product.platform}`}
        >
          View Deal <FaExternalLinkAlt style={{ marginLeft: '5px' }} />
        </a>
      </div>
      
      {/* Favorite button future login integration ke liye hai */}
      <button className="favorite-btn" title="Add to Favorites (Login Required)">
        ⭐
      </button>
    </div>
  );
}

export default ProductCard;