import React from 'react';
import { usePaperContext } from '../../context/PaperContext';
import { SortOption } from '../../types';

const SortBar: React.FC = () => {
  const { filters, setFilters, filteredPapers } = usePaperContext();
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOption = e.target.value as SortOption;
    
    setFilters(prev => ({
      ...prev,
      sortOption: newSortOption
    }));
  };

  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center">
        <span className="mr-1.5 text-xs text-gray-600 font-medium">Sort by:</span>
        <div className="relative inline-block">
          <select 
            className="pl-2 pr-6 py-1 text-xs border-0 bg-gray-50 rounded focus:outline-none focus:ring-1 focus:ring-primary-300 appearance-none cursor-pointer font-medium"
            value={filters.sortOption}
            onChange={handleSortChange}
          >
            <option value="tag-based">Tag-based</option>
            <option value="newest">Newest</option>
            {filters.searchTerm && <option value="relevance">Relevance</option>}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-600">
        {filters.searchTerm ? (
          <span className="bg-gray-50 px-2 py-0.5 rounded-full">
            <span className="font-medium text-primary-600">{filteredPapers.length}</span> papers found
          </span>
        ) : (
          <span className="text-gray-500">
            <span className="font-medium text-gray-700">{filteredPapers.length}</span> papers total
          </span>
        )}
      </div>
    </div>
  );
};

export default SortBar; 