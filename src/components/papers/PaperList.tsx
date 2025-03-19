import React, { useEffect, useState } from 'react';
import { usePaperContext } from '../../context/PaperContext';
import PaperCard from './PaperCard';
import SortBar from '../filters/SortBar';
import { parentTagColors } from '../../utils/colorUtils';

const PaperList: React.FC = () => {
  const { filteredPapers, papers, filters, isLoading, setFilters } = usePaperContext();
  const [expandedPaperId, setExpandedPaperId] = useState<number | null>(null);
  
  // Ensure tag-based view is selected when search term is cleared
  useEffect(() => {
    if (!filters.searchTerm && filters.sortOption === 'relevance') {
      setFilters(prev => ({
        ...prev,
        sortOption: 'tag-based'
      }));
    }
  }, [filters.searchTerm, filters.sortOption, setFilters]);
  
  // Reset expanded paper when search term changes
  useEffect(() => {
    setExpandedPaperId(null);
  }, [filters.searchTerm]);
  
  // Handle toggling paper expansion
  const handleToggleExpand = (paperId: number) => {
    setExpandedPaperId(expandedPaperId === paperId ? null : paperId);
  };
  
  console.log("PaperList rendering with:", {
    totalPapers: papers.length,
    filteredPapers: filteredPapers.length,
    isLoading,
    sortOption: filters.sortOption,
    searchTerm: filters.searchTerm,
    expandedPaperId
  });
  
  // Group papers by parent tag when in tag-based view
  const renderTagBasedView = () => {
    const tagGroups: Record<string, typeof filteredPapers> = {};
    
    // Group papers by parent tag (everything before the slash)
    filteredPapers.forEach(paper => {
      // Extract parent tag (everything before the slash)
      const parentTag = paper.primaryTag.split('/')[0];
      
      if (!tagGroups[parentTag]) {
        tagGroups[parentTag] = [];
      }
      tagGroups[parentTag].push(paper);
    });
    
    // If no tag groups were created but we have papers, something went wrong
    if (Object.keys(tagGroups).length === 0 && filteredPapers.length > 0) {
      console.warn("No tag groups were created despite having filtered papers", filteredPapers);
      return renderListView(); // Fallback to list view
    }
    
    return Object.entries(tagGroups).map(([tag, papers]) => {
      const tagColor = parentTagColors[tag] || '#9ca3af'; // Use the parent tag color or default to gray
      
      return (
        <div key={tag} className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center">
            <span 
              className="w-3 h-3 inline-block rounded-sm mr-1.5" 
              style={{ backgroundColor: tagColor }}
            ></span>
            <span style={{ color: tagColor }}>{tag}</span>
          </h3>
          <div className="space-y-2">
            {papers.map(paper => (
              <PaperCard 
                key={paper.id} 
                paper={paper}
                isExpanded={expandedPaperId === paper.id}
                onToggleExpand={() => handleToggleExpand(paper.id)}
                showFullDetails={filters.searchTerm !== '' || expandedPaperId === paper.id}
              />
            ))}
          </div>
        </div>
      );
    });
  };
  
  // Regular list view for newest and relevance sorting
  const renderListView = () => {
    return (
      <div className="space-y-2">
        {filteredPapers.map(paper => (
          <PaperCard 
            key={paper.id} 
            paper={paper} 
            isExpanded={expandedPaperId === paper.id}
            onToggleExpand={() => handleToggleExpand(paper.id)}
            showDate={filters.sortOption === 'newest'}
            showFullDetails={filters.searchTerm !== '' || expandedPaperId === paper.id}
          />
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary-200 border-t-primary-600"></div>
        <span className="ml-3 text-gray-600 text-sm">Loading papers...</span>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <SortBar />
      
      {filteredPapers.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-100 shadow-inner">
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-sm mb-3">No papers found. Try adjusting your filters or search term.</p>
          <div className="text-left mt-3 p-3 bg-white rounded-md border border-gray-100 max-w-lg mx-auto">
            <h3 className="font-medium text-gray-700 text-xs mb-1.5">Debug Info:</h3>
            <p className="text-xs text-gray-500 grid grid-cols-2 gap-1">
              <span>Total papers:</span> <span className="text-gray-700">{papers.length}</span>
              <span>Filtered papers:</span> <span className="text-gray-700">{filteredPapers.length}</span>
              <span>Is loading:</span> <span className="text-gray-700">{isLoading ? 'true' : 'false'}</span>
              <span>Selected tags:</span> <span className="text-gray-700">{filters.selectedTags.join(', ') || 'none'}</span>
              <span>Search term:</span> <span className="text-gray-700">{filters.searchTerm || 'none'}</span>
              <span>Sort option:</span> <span className="text-gray-700">{filters.sortOption}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filters.sortOption === 'tag-based' ? renderTagBasedView() : renderListView()}
        </div>
      )}
    </div>
  );
};

export default PaperList; 