import React, { useState } from 'react';
import './SearchBar.css';
import { FaSearch } from 'react-icons/fa';

const SearchBar = ({ onSearch, placeholder = "Search places..." }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder={placeholder}
          className="search-input"
        />
      </div>
    </div>
  );
};

export default SearchBar;
