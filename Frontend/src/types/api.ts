// TypeScript mirrors of backend DTOs — keep in sync with API_DOCS.md

// Auth
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  name: string;
}

// User
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  authProvider: 'LOCAL' | 'GOOGLE';
  emailVerified: boolean;
}

/** Public profile — no email or auth details. */
export interface ProfileResponse {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  joinedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

// Trips
export type TripStatus = 'DRAFT' | 'PUBLISHED';
export type MemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface TripResponse {
  id: string;
  title: string;
  description: string | null;
  destination: string | null;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;
  status: TripStatus;
  myRole: MemberRole;
  memberCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripSummaryResponse {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  status: TripStatus;
  myRole: MemberRole;
}

export interface TripMemberResponse {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  joinedAt: string;
}

export interface CreateTripRequest {
  title: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
}

export type UpdateTripRequest = Partial<CreateTripRequest>;

// Itinerary
export type ActivityCategory =
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'FOOD'
  | 'SIGHTSEEING'
  | 'ACTIVITY'
  | 'SHOPPING'
  | 'OTHER';

export interface ActivityResponse {
  id: string;
  dayId: string;
  title: string;
  startTime: string; // HH:mm:ss
  endTime: string | null; // HH:mm:ss — arrival/end time (e.g. flight landing)
  location: string;
  notes: string;
  cost: number | null;
  category: ActivityCategory | null;
  bookingLink: string | null;
}

export interface DayResponse {
  id: string;
  tripId: string;
  date: string; // YYYY-MM-DD
  notes: string | null;
  activities: ActivityResponse[];
}

export interface CreateDayRequest {
  date: string;
  notes?: string;
}

export interface CreateActivityRequest {
  title: string;
  startTime: string;
  endTime?: string | null;
  location: string;
  notes: string;
  cost?: number | null;
  category?: ActivityCategory | null;
  bookingLink?: string | null;
}

export type UpdateActivityRequest = Partial<CreateActivityRequest>;

// Invites
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface InviteResponse {
  id: string;
  tripId: string;
  tripTitle: string;
  invitedEmail: string;
  invitedByName: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
}

// Posts (Explore)
export interface PostResponse {
  id: string;
  tripId: string;
  caption: string | null;
  coverImageUrl: string | null;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  tripTitle: string;
  tripDescription: string | null;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  dayCount: number;
  likeCount: number;
  saveCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  createdAt: string;
}

export interface CreatePostRequest {
  tripId: string;
  caption?: string;
  coverImageUrl?: string;
}

export interface UpdatePostRequest {
  caption?: string;
  coverImageUrl?: string;
}

// WebSocket
export type TripEventType =
  | 'TRIP_UPDATED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_LEFT'
  | 'DAY_ADDED'
  | 'DAY_DELETED'
  | 'ACTIVITY_ADDED'
  | 'ACTIVITY_UPDATED'
  | 'ACTIVITY_DELETED';

export interface TripEvent {
  type: TripEventType;
  tripId: string;
  payload: unknown;
  actorId: string;
  timestamp: string;
}

// API errors
export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}
