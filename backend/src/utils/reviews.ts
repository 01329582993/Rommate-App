import prisma from './prisma';

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
}

export const getRatingSummaries = async (
  userIds: string[]
): Promise<Record<string, RatingSummary>> => {
  const result: Record<string, RatingSummary> = {};

  for (const id of userIds) {
    result[id] = { averageRating: 0, totalReviews: 0 };
  }

  if (userIds.length === 0) return result;

  const reviews = await prisma.review.findMany({
    where: { revieweeId: { in: userIds } },
    select: { revieweeId: true, rating: true },
  });

  const totals: Record<string, { sum: number; count: number }> = {};
  for (const r of reviews) {
    if (!totals[r.revieweeId]) {
      totals[r.revieweeId] = { sum: 0, count: 0 };
    }
    totals[r.revieweeId].sum += r.rating;
    totals[r.revieweeId].count += 1;
  }

  for (const id of userIds) {
    if (totals[id] && totals[id].count > 0) {
      result[id] = {
        averageRating: Number((totals[id].sum / totals[id].count).toFixed(1)),
        totalReviews: totals[id].count,
      };
    }
  }

  return result;
};
