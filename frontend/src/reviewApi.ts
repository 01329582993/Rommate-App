import { apiRequest } from './api';

export interface RatingSummary {
  average: number;
  count: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isRoommate: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer: { id: string; name: string };
  mine: boolean;
}

export interface ReviewsResponse {
  summary: RatingSummary & { distribution: Record<string, number> };
  reviews: Review[];
}

export const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export function saveReview(revieweeId: string, rating: number, comment: string) {
  return apiRequest('/api/reviews', { method: 'POST', body: { revieweeId, rating, comment } });
}

export function deleteReview(reviewId: string) {
  return apiRequest(`/api/reviews/${reviewId}`, { method: 'DELETE' });
}

export function getReviewsForUser(userId: string) {
  return apiRequest(`/api/reviews/user/${userId}`);
}

export function getReviewsIWrote() {
  return apiRequest('/api/reviews/mine');
}

export function getMyReceivedReviews() {
  return apiRequest('/api/reviews/me');
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function initials(name: string) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}
