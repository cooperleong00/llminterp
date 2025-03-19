import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Paper, Tag, FilterState } from '../types';

interface PaperContextType {
  papers: Paper[];
  filteredPapers: Paper[];
  tags: Tag[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  toggleTag: (tagId: string) => void;
  isTagSelected: (tagId: string) => boolean;
  isLoading: boolean;
}

const defaultFilters: FilterState = {
  searchTerm: '',
  sortOption: 'tag-based',
  selectedTags: [],
  primaryTagOnly: false
};

// Updated tag mapping for new format (Parent/Child)
const tagMap: Record<string, string[]> = {
  'TEC': ['Techniques'],
  'TEC_GEN': ['Techniques/General'],
  'TEC_EPR': ['Techniques/Embedding Projection'],
  'TEC_PRO': ['Techniques/Probing'],
  'TEC_CIN': ['Techniques/Causal Intervention'],
  'TEC_AUT': ['Techniques/Automation'],
  'TEC_SCO': ['Techniques/Sparse Coding'],
  'TEC_VIS': ['Techniques/Visualization'],
  'TEC_TRA': ['Techniques/Translation'],
  'TEC_BEN': ['Techniques/Benchmark'],
  
  'ABI': ['Ability'],
  'ABI_GEN': ['Ability/General'],
  'ABI_REA': ['Ability/Reasoning'],
  'ABI_FUN': ['Ability/Function'],
  'ABI_ARI': ['Ability/Arithmetic Ability'],
  'ABI_ICL': ['Ability/In-Context Learning'],
  'ABI_FAC': ['Ability/Factual Knowledge'],
  'ABI_MUL': ['Ability/Multilingual'],
  'ABI_MMD': ['Ability/Multimodal'],
  
  'COM': ['Component'],
  'COM_GEN': ['Component/General'],
  'COM_ATT': ['Component/Attention'],
  'COM_MLP': ['Component/MLP'],
  'COM_NEU': ['Component/Neuron'],
  
  'LDY': ['Learning Dynamics'],
  'LDY_GEN': ['Learning Dynamics/General'],
  'LDY_PTR': ['Learning Dynamics/Phase Transition'],
  'LDY_FTN': ['Learning Dynamics/Fine-tuning'],
  
  'REP': ['Representation'],
  'REP_GEN': ['Representation/General'],
  'REP_LIN': ['Representation/Linearity'],
  
  'APP': ['Application'],
  'APP_TRN': ['Application/Training'],
  'APP_AST': ['Application/Activation Steering'],
  'APP_KED': ['Application/Knowledge Editing'],
  'APP_HAL': ['Application/Hallucination'],
  'APP_RED': ['Application/Redundancy']
};

const PaperContext = createContext<PaperContextType | undefined>(undefined);

export const PaperProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch papers and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Attempting to fetch data...');
        // Use the correct paths for GitHub Pages deployment
        const papersUrl = process.env.PUBLIC_URL + '/data/papers.json';
        const tagsUrl = process.env.PUBLIC_URL + '/data/tags.json';
        
        console.log('Fetching papers from:', papersUrl);
        console.log('Fetching tags from:', tagsUrl);
        
        const [papersResponse, tagsResponse] = await Promise.all([
          fetch(papersUrl),
          fetch(tagsUrl)
        ]);
        
        if (!papersResponse.ok) {
          console.error('Failed to fetch papers:', papersResponse.status, papersResponse.statusText);
          return;
        }
        
        if (!tagsResponse.ok) {
          console.error('Failed to fetch tags:', tagsResponse.status, tagsResponse.statusText);
          return;
        }
        
        const papersData = await papersResponse.json();
        const tagsData = await tagsResponse.json();
        
        console.log('Fetched papers:', papersData);
        console.log('Fetched tags:', tagsData);
        
        setPapers(papersData);
        setTags(tagsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Setup Fuse.js for search
  const fuse = useMemo(() => new Fuse(papers, {
    keys: ['title', 'abstract', 'tags', 'authors', 'primaryTag'],
    threshold: 0.4,
    includeScore: true
  }), [papers]);
  
  // Helper function to compare dates (YYYY or YYYY-MM formats)
  const compareDates = (a: string, b: string): number => {
    // Handle undefined or empty values
    if (!a && !b) return 0;
    if (!a) return 1; // b is newer
    if (!b) return -1; // a is newer
    
    // Extract year and month parts
    const aYearMonth = a.split('-');
    const bYearMonth = b.split('-');
    
    // Compare years first
    const yearComparison = parseInt(bYearMonth[0]) - parseInt(aYearMonth[0]);
    if (yearComparison !== 0) return yearComparison;
    
    // If years are equal, compare months if available
    if (aYearMonth.length > 1 && bYearMonth.length > 1) {
      return parseInt(bYearMonth[1]) - parseInt(aYearMonth[1]);
    }
    
    // If one has month and other doesn't, the one with month is more recent
    if (bYearMonth.length > 1) return 1;
    if (aYearMonth.length > 1) return -1;
    
    // Equal dates
    return 0;
  };
  
  // Apply filters and sorting
  useEffect(() => {
    console.log('Filtering papers. Current papers:', papers.length);
    console.log('Current filters:', filters);
    
    let result = [...papers];
    
    // Apply tag filtering
    if (filters.selectedTags.length > 0) {
      result = result.filter(paper => {
        return filters.selectedTags.some(tagId => {
          // Get the tag values that correspond to this tag ID
          const tagValues = tagMap[tagId] || [];
          
          // If parent category is selected, match all papers with that parent
          if (tagId.length === 3) { // Parent tags are 3 characters (e.g., TEC, COM, ABI)
            const parentPrefix = tagValues[0].split('/')[0]; // Get parent name
            
            // Check if primary tag starts with this parent
            const primaryTagMatch = paper.primaryTag.startsWith(parentPrefix);
            
            // If primaryTagOnly is true, only check primary tag
            if (filters.primaryTagOnly) {
              return primaryTagMatch;
            }
            
            // Otherwise check all tags
            const tagMatch = paper.tags.some(paperTag => paperTag.startsWith(parentPrefix));
            return tagMatch || primaryTagMatch;
          }
          
          // For specific child tags, do exact matching
          // If primaryTagOnly is true, only check primary tag
          if (filters.primaryTagOnly) {
            return tagValues.includes(paper.primaryTag);
          }
          
          // Otherwise check all tags
          const tagMatch = paper.tags.some(paperTag => tagValues.includes(paperTag));
          const primaryTagMatch = tagValues.includes(paper.primaryTag);
          
          console.log('Filtering paper:', paper.title, 'with tagId:', tagId, 'tagValues:', tagValues, 'paper.tags:', paper.tags, 'match?', tagMatch || primaryTagMatch);
          
          return tagMatch || primaryTagMatch;
        });
      });
    }
    
    // Apply search
    if (filters.searchTerm) {
      const searchResults = fuse.search(filters.searchTerm);
      result = searchResults.map(res => res.item);
    }
    
    // Apply sorting
    switch (filters.sortOption) {
      case 'newest':
        result.sort((a, b) => compareDates(a.date, b.date));
        break;
      case 'relevance':
        // Relevance sorting is already handled by Fuse.js when searching
        // If not searching, fall back to newest
        if (!filters.searchTerm) {
          result.sort((a, b) => compareDates(a.date, b.date));
        }
        break;
      case 'tag-based':
      default:
        // Group by parent tag - extract parent from primaryTag
        const tagGroups: Record<string, Paper[]> = {};
        result.forEach(paper => {
          const parentTag = paper.primaryTag.split('/')[0]; // Extract parent
          
          if (!tagGroups[parentTag]) {
            tagGroups[parentTag] = [];
          }
          tagGroups[parentTag].push(paper);
        });
        
        // Sort papers within each parent tag group according to predefined child tag order
        Object.keys(tagGroups).forEach(parentTag => {
          // Find the parent tag definition to get child order
          const parentTagDefinition = tags.find(tag => tag.name === parentTag);
          
          if (parentTagDefinition && parentTagDefinition.children) {
            // Create a map of child tag name to its index in the children array
            const childOrderMap: Record<string, number> = {};
            parentTagDefinition.children.forEach((child, index) => {
              childOrderMap[child.name] = index;
            });
            
            // Sort the papers in this parent group by their child tag order
            tagGroups[parentTag].sort((a, b) => {
              // Extract the child part of the primary tag
              const aChildTag = a.primaryTag.split('/')[1] || '';
              const bChildTag = b.primaryTag.split('/')[1] || '';
              
              // Get the order index of each child tag, defaulting to Infinity if not found
              const aOrder = childOrderMap[aChildTag] !== undefined ? childOrderMap[aChildTag] : Infinity;
              const bOrder = childOrderMap[bChildTag] !== undefined ? childOrderMap[bChildTag] : Infinity;
              
              // Sort by the order index, then by title for papers with the same child tag
              return aOrder - bOrder || a.title.localeCompare(b.title);
            });
          } else {
            // Fallback to sorting by title if parent tag definition not found
            tagGroups[parentTag].sort((a, b) => a.title.localeCompare(b.title));
          }
        });
        
        // Get the order of parent tags from the tags array
        const parentTagOrderMap: Record<string, number> = {};
        tags.forEach((tag, index) => {
          parentTagOrderMap[tag.name] = index;
        });
        
        // Sort parent tag groups according to their order in the tags array
        const sortedParentTags = Object.keys(tagGroups).sort((a, b) => {
          const aOrder = parentTagOrderMap[a] !== undefined ? parentTagOrderMap[a] : Infinity;
          const bOrder = parentTagOrderMap[b] !== undefined ? parentTagOrderMap[b] : Infinity;
          return aOrder - bOrder;
        });
        
        // Flatten the grouped and sorted papers maintaining parent tag order
        result = sortedParentTags.flatMap(parentTag => tagGroups[parentTag]);
        break;
    }
    
    console.log('Filtered papers result:', result.length);
    setFilteredPapers(result);
  }, [papers, filters, fuse, tags]);
  
  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setFilters(prevFilters => {
      if (prevFilters.selectedTags.includes(tagId)) {
        return {
          ...prevFilters,
          selectedTags: prevFilters.selectedTags.filter(id => id !== tagId)
        };
      } else {
        return {
          ...prevFilters,
          selectedTags: [...prevFilters.selectedTags, tagId]
        };
      }
    });
  };
  
  // Check if a tag is selected
  const isTagSelected = (tagId: string) => {
    return filters.selectedTags.includes(tagId);
  };
  
  return (
    <PaperContext.Provider
      value={{
        papers,
        filteredPapers,
        tags,
        filters,
        setFilters,
        toggleTag,
        isTagSelected,
        isLoading
      }}
    >
      {children}
    </PaperContext.Provider>
  );
};

export const usePaperContext = () => {
  const context = useContext(PaperContext);
  if (context === undefined) {
    throw new Error('usePaperContext must be used within a PaperProvider');
  }
  return context;
}; 