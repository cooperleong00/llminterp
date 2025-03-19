import React from 'react';
import { Paper } from '../../types';
import { getTagColor } from '../../utils/colorUtils';

interface PaperCardProps {
  paper: Paper;
  showDate?: boolean;
  showFullDetails?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const PaperCard: React.FC<PaperCardProps> = ({ 
  paper, 
  showDate = false,
  showFullDetails = false,
  isExpanded = false,
  onToggleExpand
}) => {
  const isClickable = onToggleExpand !== undefined;

  const handleClick = () => {
    if (isClickable) {
      onToggleExpand?.();
    }
  };

  // Generate tag badge style with the appropriate color
  const getTagStyle = (tagName: string) => {
    const bgColor = getTagColor(tagName);
    return {
      backgroundColor: bgColor,
      color: isLightColor(bgColor) ? '#1f2937' : '#ffffff', // Dark text for light backgrounds, light text for dark backgrounds
    };
  };

  // Helper to determine if a color is light (to decide text color)
  const isLightColor = (hexColor: string): boolean => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate perceived brightness using YIQ formula
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 150; // Threshold for determining if color is light
  };

  return (
    <div 
      className={`bg-white border border-gray-50 rounded-lg shadow-soft mb-3 transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:shadow-medium' : ''
      } ${isExpanded ? 'ring-1 ring-primary-300 border-primary-100' : ''}`}
      onClick={handleClick}
    >
      <div className="p-3">
        <div className="flex justify-between items-start mb-1.5">
          <h2 className="text-base font-medium text-gray-800 mr-2">{paper.title || 'Untitled Paper'}</h2>
          <div className="flex items-center space-x-2">
            {!isExpanded && paper.primaryTag && (
              <span 
                className="px-1.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap"
                style={getTagStyle(paper.primaryTag)}
              >
                #{paper.primaryTag}
              </span>
            )}
            {isClickable && (
              <button 
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {paper.primaryTag && (
              <span 
                key={`primary-${paper.primaryTag}`} 
                className="px-1.5 py-0.5 text-xs font-medium rounded-full"
                style={getTagStyle(paper.primaryTag)}
              >
                #{paper.primaryTag}
              </span>
            )}
            
            {paper.tags && paper.tags.length > 0 ? (
              paper.tags
                .filter(tag => tag !== paper.primaryTag) // Don't show primary tag twice
                .map(tag => (
                  <span 
                    key={tag} 
                    className="px-1.5 py-0.5 text-xs font-medium rounded-full"
                    style={getTagStyle(tag)}
                  >
                    #{tag}
                  </span>
                ))
            ) : (
              !paper.primaryTag && <span className="text-xs text-gray-400">No tags</span>
            )}
          </div>
        )}
        
        {(showDate || showFullDetails) && (
          <div className="text-xs text-gray-500 mb-1">
            Date: <span className="font-medium">{paper.date || 'Unknown'}</span>
          </div>
        )}
        
        {showFullDetails && (
          <>
            <div className="text-xs text-gray-600 mb-2">
              <span className="font-medium text-gray-700">Authors:</span> {paper.authors && paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown'}
            </div>
            
            <p className="text-xs text-gray-700 leading-relaxed mb-3 border-l-2 border-primary-200 pl-2">
              {paper.abstract || 'No abstract available'}
            </p>
            
            <div className="flex flex-wrap gap-1.5 mt-2 justify-end">
              {Object.entries(paper.urls || {}).length > 0 ? (
                Object.entries(paper.urls).map(([type, url]) => (
                  url && (
                    <a 
                      key={type} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {type === 'arxiv' && (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zm-2 0a8 8 0 10-16 0 8 8 0 0016 0zm-8-5a1 1 0 110 2 1 1 0 010-2zm-2 3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1z" />
                        </svg>
                      )}
                      {type === 'github' && (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                      )}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </a>
                  )
                ))
              ) : (
                <span className="text-xs text-gray-400">No URLs available</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaperCard; 