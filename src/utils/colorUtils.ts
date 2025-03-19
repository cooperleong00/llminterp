// Define parent tag color mapping (base colors for each family)
export const parentTagColors: Record<string, string> = {
  'Techniques': '#3b82f6', // Blue
  'Component': '#10b981', // Green
  'Ability': '#8b5cf6', // Purple
  'Learning Dynamics': '#f97316', // Orange 
  'Representation': '#ef4444', // Red
  'Application': '#14b8a6', // Teal
};

// Color palettes for each parent tag (from lightest to darkest)
const blueColors = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#0369a1', '#0c4a6e', '#082f49'];
const greenColors = ['#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b'];
const purpleColors = ['#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];
const orangeColors = ['#ffedd5', '#fed7aa', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'];
const redColors = ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b'];
const tealColors = ['#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59'];

// Define children tag colors, with variations within each parent's color family
// Colors are ordered according to the predefined children tag order in tags.json
export const childTagColors: Record<string, Record<string, string>> = {
  'Techniques': {
    'General': blueColors[1],
    'Embedding Projection': blueColors[3],
    'Probing': blueColors[4],
    'Causal Intervention': blueColors[5],
    'Automation': blueColors[0],
    'Sparse Coding': blueColors[6],
    'Visualization': blueColors[2],
    'Translation': blueColors[7],
    'Benchmark': blueColors[8],
  },
  'Component': {
    'General': greenColors[1],
    'Attention': greenColors[3],
    'MLP': greenColors[4],
    'Neuron': greenColors[2],
  },
  'Ability': {
    'General': purpleColors[2],
    'Reasoning': purpleColors[4],
    'Function': purpleColors[5],
    'Arithmetic Ability': purpleColors[3],
    'In-Context Learning': purpleColors[1],
    'Factual Knowledge': purpleColors[6],
    'Multilingual': purpleColors[0],
    'Multimodal': purpleColors[7],
  },
  'Learning Dynamics': {
    'General': orangeColors[2],
    'Phase Transition': orangeColors[4],
    'Fine-tuning': orangeColors[5],
  },
  'Representation': {
    'General': redColors[2],
    'Linearity': redColors[4],
  },
  'Application': {
    'Training': tealColors[2],
    'Activation Steering': tealColors[4],
    'Knowledge Editing': tealColors[5],
    'Hallucination': tealColors[3],
    'Redundancy': tealColors[1],
  }
};

// Utility function to get tag color based on tag name
export const getTagColor = (tagName: string): string => {
  // Split the tag to get parent and child
  const parts = tagName.split('/');
  const parent = parts[0];
  const child = parts.length > 1 ? parts[1] : 'General';
  
  // If it's just a parent tag or a general child tag
  if (parts.length === 1 || child === 'General') {
    return parentTagColors[parent] || '#9ca3af'; // Default gray if not found
  }
  
  // Get the color for the specific child tag
  return (childTagColors[parent] && childTagColors[parent][child]) 
    ? childTagColors[parent][child] 
    : parentTagColors[parent] || '#9ca3af'; // Fallback to parent color or default gray
}; 