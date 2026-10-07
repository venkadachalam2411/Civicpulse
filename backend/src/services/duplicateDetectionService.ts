import Issue, { IIssue } from '../models/Issue';

// Calculate Haversine distance in kilometers
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate token Jaccard similarity score between two texts
function getJaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

export async function detectDuplicates(
  title: string,
  description: string,
  category: string,
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 2.0
): Promise<{ isDuplicate: boolean; matchedIssue?: IIssue; similarityScore: number; distanceKm: number }> {
  // Find unresolved issues in the same category
  const candidateIssues = await Issue.find({
    category,
    status: { $nin: ['resolved', 'closed', 'rejected'] },
  }).exec();

  let bestMatch: IIssue | undefined = undefined;
  let highestScore = 0;
  let closestDistance = Infinity;

  for (const candidate of candidateIssues) {
    const dist = getHaversineDistance(latitude, longitude, candidate.latitude, candidate.longitude);
    if (dist <= maxDistanceKm) {
      const titleSim = getJaccardSimilarity(title, candidate.title);
      const descSim = getJaccardSimilarity(description, candidate.description);
      const combinedSim = titleSim * 0.6 + descSim * 0.4;

      if (combinedSim > 0.25 && combinedSim > highestScore) {
        highestScore = combinedSim;
        bestMatch = candidate;
        closestDistance = dist;
      }
    }
  }

  return {
    isDuplicate: highestScore >= 0.25,
    matchedIssue: bestMatch,
    similarityScore: Math.round(highestScore * 100),
    distanceKm: Math.round(closestDistance * 100) / 100,
  };
}
