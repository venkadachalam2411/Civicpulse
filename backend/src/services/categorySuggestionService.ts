interface CategoryKeywordMap {
  [categoryName: string]: string[];
}

const KEYWORD_MAP: CategoryKeywordMap = {
  Roads: ['pothole', 'asphalt', 'road', 'street', 'highway', 'crack', 'speed breaker', 'pavement', 'divider', 'tar', 'pit'],
  Garbage: ['trash', 'garbage', 'waste', 'litter', 'dump', 'bin', 'stench', 'refuse', 'dumpster', 'rubbish', 'dirt', 'heap'],
  Drainage: ['drain', 'sewer', 'clog', 'overflow', 'sewage', 'gutter', 'flooding', 'stagnant', 'wastewater', 'sludge', 'manhole'],
  Water: ['leak', 'pipeline', 'pipe', 'drinking water', 'contamination', 'pressure', 'tap', 'valve', 'supply', 'burst', 'water shortage'],
  Electricity: ['power outage', 'wire', 'transformer', 'sparks', 'voltage', 'pole', 'current', 'fuse', 'electric', 'short circuit'],
  'Street Lights': ['street light', 'lamp', 'dark', 'streetlight', 'bulb', 'dark road', 'night lighting', 'light pole', 'flickering'],
  Traffic: ['signal', 'jam', 'sign', 'congestion', 'zebra crossing', 'illegal parking', 'traffic light', 'gridlock', 'violation'],
  'Public Property': ['bench', 'park', 'playground', 'bus stop', 'wall', 'fence', 'vandalized', 'public toilet', 'monument', 'statue'],
  Sanitation: ['hygiene', 'public toilet', 'open defecation', 'foul smell', 'unhygienic', 'sanitation', 'cleanliness', 'disinfection'],
};

export function suggestCategory(description: string, title: string = ''): { suggestedCategory: string; confidenceScore: number } {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  let bestCategory = 'Other';
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        matchCount += 1;
      }
    }
    if (matchCount > maxMatches) {
      maxMatches = matchCount;
      bestCategory = category;
    }
  }

  const confidenceScore = maxMatches > 0 ? Math.min(maxMatches * 30 + 40, 95) : 30;

  return {
    suggestedCategory: bestCategory,
    confidenceScore,
  };
}
