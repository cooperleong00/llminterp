import React from 'react';
import { Tag } from '../../types';
import { usePaperContext } from '../../context/PaperContext';

interface TagFilterProps {
  tag: Tag;
  isExpanded: boolean;
  toggleExpand: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ tag, isExpanded, toggleExpand }) => {
  const { toggleTag, isTagSelected, filters, setFilters, tags } = usePaperContext();
  
  const hasChildren = tag.children && tag.children.length > 0;
  
  // Helper function to find a parent tag by ID
  const findParentTag = (parentId: string): Tag | undefined => {
    return tags.find(t => t.id === parentId);
  };
  
  const handleTagClick = (e: React.MouseEvent, tagParam: Tag) => {
    console.log('handleTagClick', tagParam);
    // Only handle click if we're in tag-based view
    if (filters.sortOption === 'tag-based') {
      // For parent tags (e.g., "TEC" with name "Techniques")
      if (!tagParam.id.includes('_')) {
        // This is a parent tag, use its name directly
        const sectionSelector = `[data-tag-section="${tagParam.name}"]`;
        console.log('Looking for parent section:', sectionSelector);
        
        const tagSection = document.querySelector(sectionSelector);
        if (tagSection) {
          console.log('Found parent section, scrolling to it');
          tagSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.log('Parent section not found for:', tagParam.name);
        }
      } else {
        // This is a child tag (e.g., "TEC_EPR" with name "Embedding Projection")
        // We need to find the parent name and the child name
        
        // Get parent tag info
        const parentId = tagParam.id.split('_')[0]; // e.g., "TEC"
        const parentTag = findParentTag(parentId);
        
        if (parentTag) {
          // The child section has data-tag-section="Techniques/Embedding Projection"
          const sectionSelector = `[data-tag-section="${parentTag.name}/${tagParam.name}"]`;
          console.log('Looking for child section:', sectionSelector);
          
          const tagSection = document.querySelector(sectionSelector);
          if (tagSection) {
            console.log('Found child section, scrolling to it');
            tagSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            // Try fallback to parent
            const fallbackSelector = `[data-tag-section="${parentTag.name}"]`;
            console.log('Child section not found, trying parent:', fallbackSelector);
            
            const parentSection = document.querySelector(fallbackSelector);
            if (parentSection) {
              console.log('Found parent section, scrolling to it');
              parentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              console.log('Neither child nor parent section found');
            }
          }
        } else {
          console.log('Could not find parent tag for:', tagParam.id);
        }
      }
    }
  };
  
  return (
    <div className="ml-0.5">
      <div className="flex items-center">
        {hasChildren && (
          <button 
            onClick={toggleExpand}
            className="mr-1 text-xs text-gray-500 w-3 h-3 flex items-center justify-center"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <div className="flex items-center">
          <label className="cursor-pointer flex items-center">
            <input
              type="checkbox"
              className="checkbox checkbox-xs mr-1.5 border-gray-300 text-primary-600 rounded focus:ring-primary-500"
              checked={isTagSelected(tag.id)}
              onChange={() => toggleTag(tag.id)}
              id={`tag-${tag.id}`}
            />
          </label>
          <span 
            className={`text-xs text-gray-700 font-medium ml-1.5 ${
              filters.sortOption === 'tag-based' 
                ? 'hover:text-primary-600 cursor-pointer' 
                : 'cursor-default'
            }`}
            onClick={(e) => handleTagClick(e, tag)}
          >
            {tag.name}
          </span>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="pl-4 mt-0.5 border-l border-gray-100 ml-1">
          {tag.children?.map(childTag => (
            <div key={childTag.id} className="flex items-center mt-1">
              <label className="cursor-pointer flex items-center">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs mr-1 border-gray-300 text-primary-500 rounded focus:ring-primary-400"
                  checked={isTagSelected(childTag.id)}
                  onChange={() => toggleTag(childTag.id)}
                  id={`tag-${childTag.id}`}
                />
              </label>
              <span 
                className={`text-xs text-gray-600 ml-1.5 ${
                  filters.sortOption === 'tag-based' 
                    ? 'hover:text-primary-600 cursor-pointer' 
                    : 'cursor-default'
                }`}
                onClick={(e) => handleTagClick(e, childTag)}
              >
                {childTag.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagFilter; 