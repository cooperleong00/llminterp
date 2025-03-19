import React from 'react';
import { Tag } from '../../types';
import { usePaperContext } from '../../context/PaperContext';

interface TagFilterProps {
  tag: Tag;
  isExpanded: boolean;
  toggleExpand: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ tag, isExpanded, toggleExpand }) => {
  const { toggleTag, isTagSelected } = usePaperContext();
  
  const hasChildren = tag.children && tag.children.length > 0;
  
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
            <span className="text-xs text-gray-700 font-medium">{tag.name}</span>
          </label>
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
                <span className="text-xs text-gray-600">{childTag.name}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagFilter; 