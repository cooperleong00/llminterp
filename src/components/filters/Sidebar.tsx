import React, { useState, useEffect } from 'react';
import { usePaperContext } from '../../context/PaperContext';
import TagFilter from './TagFilter';

const Sidebar: React.FC = () => {
  const { tags, filters, setFilters } = usePaperContext();
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});

  // Initialize all tags as expanded by default
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    tags.forEach(tag => {
      initialExpandedState[tag.id] = true;
    });
    setExpandedTags(initialExpandedState);
  }, [tags]);
  
  const toggleExpand = (tagId: string) => {
    setExpandedTags(prev => ({
      ...prev,
      [tagId]: !prev[tagId]
    }));
  };

  const togglePrimaryTagOnly = () => {
    setFilters(prev => ({
      ...prev,
      primaryTagOnly: !prev.primaryTagOnly
    }));
  };

  return (
    <aside className="w-54 py-3 pr-2 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-soft p-3 sticky top-20">
        <h2 className="text-sm font-medium text-gray-800 border-b border-gray-100 pb-2 mb-2">Filters</h2>
        
        <div className="mb-4">
          <div className="flex items-center mb-3">
            <input
              id="primary-tag-only"
              type="checkbox"
              className="checkbox checkbox-sm mr-2 border-gray-300 text-primary-600 rounded focus:ring-primary-500"
              checked={filters.primaryTagOnly}
              onChange={togglePrimaryTagOnly}
            />
            <label htmlFor="primary-tag-only" className="text-xs text-gray-700 cursor-pointer">
              Filter primary tags only
            </label>
          </div>
          
          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Tags</h3>
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <div className="space-y-3 pb-8">
              {tags.map(tag => (
                <TagFilter
                  key={tag.id}
                  tag={tag}
                  isExpanded={!!expandedTags[tag.id]}
                  toggleExpand={() => toggleExpand(tag.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 