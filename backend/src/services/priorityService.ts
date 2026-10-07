import { SeverityType, PriorityType } from '../models/Issue';

export function calculatePriorityScore(
  severity: SeverityType,
  upvotesCount: number = 0,
  createdDate: Date = new Date()
): { score: number; priority: PriorityType } {
  let baseScore = 30;

  switch (severity) {
    case 'critical':
      baseScore = 70;
      break;
    case 'high':
      baseScore = 50;
      break;
    case 'medium':
      baseScore = 30;
      break;
    case 'low':
      baseScore = 15;
      break;
  }

  // Upvote bonus: 2 points per upvote up to max 20 points
  const upvoteBonus = Math.min(upvotesCount * 2, 20);

  // Age bonus: 1 point per day up to max 10 points
  const diffTime = Math.abs(new Date().getTime() - new Date(createdDate).getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const ageBonus = Math.min(diffDays, 10);

  let finalScore = baseScore + upvoteBonus + ageBonus;
  finalScore = Math.min(Math.max(finalScore, 0), 100);

  let priority: PriorityType = 'low';
  if (finalScore >= 85) {
    priority = 'critical';
  } else if (finalScore >= 60) {
    priority = 'high';
  } else if (finalScore >= 30) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  return { score: finalScore, priority };
}

export function calculateSlaDeadline(priority: PriorityType, fromDate: Date = new Date()): Date {
  const deadline = new Date(fromDate);
  switch (priority) {
    case 'critical':
      deadline.setHours(deadline.getHours() + 12);
      break;
    case 'high':
      deadline.setHours(deadline.getHours() + 24);
      break;
    case 'medium':
      deadline.setHours(deadline.getHours() + 72); // 3 days
      break;
    case 'low':
      deadline.setHours(deadline.getHours() + 168); // 7 days
      break;
  }
  return deadline;
}
