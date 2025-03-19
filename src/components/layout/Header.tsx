import React from 'react';
import { usePaperContext } from '../../context/PaperContext';

const Header: React.FC = () => {
  const { filters, setFilters } = usePaperContext();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    
    setFilters(prev => ({
      ...prev,
      searchTerm: newSearchTerm,
      // Explicitly set to tag-based when empty, otherwise relevance
      sortOption: newSearchTerm ? 'relevance' : 'tag-based'
    }));
  };

  // Clear search button handler
  const handleClearSearch = () => {
    setFilters(prev => ({
      ...prev,
      searchTerm: '',
      sortOption: 'tag-based'  // Explicitly reset to tag-based
    }));
  };

  return (
    <div className="bg-white border-b border-gray-100 shadow-soft py-2 px-3 sticky top-0 z-10">
      <div className="flex flex-col items-center max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-primary-600 tracking-tight mb-2">LLMInterp</h1>
        <div className="form-control w-full max-w-lg">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Papers"
              className="input input-bordered input-sm bg-gray-50 border-gray-100 w-full pr-8 focus:ring focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
              value={filters.searchTerm}
              onChange={handleSearchChange}
            />
            {filters.searchTerm && (
              <button 
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-8 flex items-center pr-1 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 