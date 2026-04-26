# HighPeak API Documentation

**Base URL:** `http://localhost:8080/api/v1`

All endpoints except auth require a JWT access token in the `Authorization` header:
```
Authorization: Bearer <accessToken>
```

In Postman: **Authorization tab → Bearer Token → paste the `accessToken` value.**

---

## Table of Contents
1. [Auth](#1-auth)
2. [User](#2-user)
3. [Trips](#3-trips)
4. [Trip Members](#4-trip-members)
5. [Invites](#5-invites)
6. [Itinerary](#6-itinerary)
7. [WebSocket](#7-websocket)
8. [Error Responses](#8-error-responses)

---

## 1. Auth

### Register
**POST** `/auth/register`

Creates a new account and returns tokens. If the registered email has any pending invites, they are automatically accepted.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "mypassword123",
  "name": "John Doe"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `email` | Yes | Valid email format |
| `password` | Yes | Minimum 8 characters |
| `name` | Yes | Maximum 100 characters |

**Response `201 Created`:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

### Login
**POST** `/auth/login`

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "mypassword123"
}
```

**Response `200 OK`:** Same as Register response.

---

### Refresh Token
**POST** `/auth/refresh`

Exchange a refresh token for a new access token + refresh token pair. The old refresh token is invalidated immediately.

**Request body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response `200 OK`:** Same as Register response.

---

### Logout
**POST** `/auth/logout`

Invalidates the refresh token server-side.

**Request body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response `204 No Content`**

---

## 2. User

### Get Current User
**GET** `/users/me`

Requires: JWT token

**Response `200 OK`:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": null,
  "authProvider": "LOCAL",
  "emailVerified": false
}
```

`authProvider` is either `LOCAL` or `GOOGLE`.

---

## 3. Trips

All trip endpoints require a JWT token.

### Create Trip
**POST** `/trips`

**Request body:**
```json
{
  "title": "Japan 2025",
  "description": "Cherry blossom season trip",
  "destination": "Tokyo, Japan",
  "startDate": "2025-03-25",
  "endDate": "2025-04-05"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `title` | Yes | Max 255 characters |
| `description` | No | Free text |
| `destination` | No | Free text |
| `startDate` | No | Format: `YYYY-MM-DD` |
| `endDate` | No | Format: `YYYY-MM-DD` |

**Response `201 Created`:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "Japan 2025",
  "description": "Cherry blossom season trip",
  "destination": "Tokyo, Japan",
  "startDate": "2025-03-25",
  "endDate": "2025-04-05",
  "status": "DRAFT",
  "myRole": "OWNER",
  "memberCount": 1,
  "createdBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

`status` is `DRAFT` or `PUBLISHED`. `myRole` is `OWNER`, `EDITOR`, or `VIEWER`.

---

### Get My Trips
**GET** `/trips`

Returns all trips the authenticated user is a member of.

**Response `200 OK`:**
```json
[
  {
    "id": "3fa85f64-...",
    "title": "Japan 2025",
    "destination": "Tokyo, Japan",
    "startDate": "2025-03-25",
    "endDate": "2025-04-05",
    "status": "DRAFT",
    "myRole": "OWNER"
  }
]
```

---

### Get Trip by ID
**GET** `/trips/{id}`

Returns full trip details. Requester must be a member of the trip.

**Response `200 OK`:** Same as Create Trip response.

---

### Update Trip
**PATCH** `/trips/{id}`

Partial update — only fields included in the body are changed. Requires `OWNER` or `EDITOR` role.

**Request body (all fields optional):**
```json
{
  "title": "Japan Spring 2025",
  "destination": "Kyoto, Japan",
  "startDate": "2025-03-28",
  "endDate": "2025-04-08"
}
```

**Response `200 OK`:** Same as Create Trip response.

Publishes a WebSocket event to all trip members on success.

---

### Delete Trip
**DELETE** `/trips/{id}`

Permanently deletes the trip and all its data. Requires `OWNER` role.

**Response `204 No Content`**

---

## 4. Trip Members

### Get Members
**GET** `/trips/{id}/members`

Requester must be a member of the trip.

**Response `200 OK`:**
```json
[
  {
    "userId": "3fa85f64-...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": null,
    "role": "OWNER",
    "joinedAt": "2025-01-15T10:30:00Z"
  }
]
```

---

### Remove a Member
**DELETE** `/trips/{id}/members/{memberId}`

Removes another user from the trip. Requires `OWNER` role. The owner cannot remove themselves (delete the trip instead).

`memberId` is the UUID of the **user** to remove (not a TripMember ID).

**Response `204 No Content`**

Publishes a WebSocket event to all trip members on success.

---

### Leave a Trip
**DELETE** `/trips/{id}/members/me`

Removes the authenticated user from the trip. The `OWNER` cannot leave (delete the trip instead).

**Response `204 No Content`**

Publishes a WebSocket event to all trip members on success.

---

## 5. Invites

All invite endpoints require a JWT token.

### Send Invite
**POST** `/trips/{tripId}/invites`

Sends an email invite to a user. Requires `OWNER` or `EDITOR` role. Only one pending invite per email per trip is allowed.

**Request body:**
```json
{
  "email": "friend@example.com"
}
```

**Response `201 Created`:**
```json
{
  "id": "3fa85f64-...",
  "tripId": "3fa85f64-...",
  "tripTitle": "Japan 2025",
  "invitedEmail": "friend@example.com",
  "invitedByName": "John Doe",
  "status": "PENDING",
  "expiresAt": "2025-01-22T10:30:00Z",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

`status` is `PENDING`, `ACCEPTED`, `REVOKED`, or `EXPIRED`. Invites expire after 7 days.

---

### Get Pending Invites
**GET** `/trips/{tripId}/invites`

Lists all pending invites for a trip. Requires `OWNER` or `EDITOR` role.

**Response `200 OK`:** Array of invite objects (same as above).

---

### Revoke Invite
**DELETE** `/trips/{tripId}/invites/{inviteId}`

Cancels a pending invite. Requires `OWNER` or `EDITOR` role.

**Response `204 No Content`**

---

### Accept Invite
**POST** `/invites/{token}/accept`

The invited user accepts their invite. The token comes from the invite email link. The authenticated user's email must match the invited email. Accepted members join as `EDITOR`.

**No request body.**

**Response `204 No Content`**

Publishes a WebSocket event to all trip members on success.

---

## 6. Itinerary

All itinerary endpoints require a JWT token. The requester must be a member of the trip. Write operations (`POST`, `PATCH`, `DELETE`) require `OWNER` or `EDITOR` role.

### Get Itinerary
**GET** `/trips/{tripId}/itinerary`

Returns all days with their activities, sorted by date ascending. Activities within each day are sorted by start time.

**Response `200 OK`:**
```json
[
  {
    "id": "3fa85f64-...",
    "tripId": "3fa85f64-...",
    "date": "2025-03-25",
    "notes": "Arrival day",
    "activities": [
      {
        "id": "3fa85f64-...",
        "dayId": "3fa85f64-...",
        "title": "Check in to hotel",
        "startTime": "14:00:00",
        "location": "Shinjuku, Tokyo",
        "notes": "Early check-in requested",
        "cost": 150.00,
        "category": "ACCOMMODATION",
        "bookingLink": "https://booking.com/..."
      }
    ]
  }
]
```

---

### Add Day
**POST** `/trips/{tripId}/itinerary/days`

Adds a new day to the itinerary. Each date can only appear once per trip.

**Request body:**
```json
{
  "date": "2025-03-25",
  "notes": "Arrival day"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `date` | Yes | Format: `YYYY-MM-DD`, must be unique within the trip |
| `notes` | No | Free text |

**Response `201 Created`:** A `DayResponse` object with an empty `activities` array.

Publishes a WebSocket event to all trip members on success.

---

### Delete Day
**DELETE** `/trips/{tripId}/itinerary/days/{dayId}`

Deletes the day and all its activities.

**Response `204 No Content`**

Publishes a WebSocket event to all trip members on success.

---

### Add Activity
**POST** `/trips/{tripId}/itinerary/days/{dayId}/activities`

**Request body:**
```json
{
  "title": "Visit Senso-ji Temple",
  "startTime": "09:00:00",
  "location": "Asakusa, Tokyo",
  "notes": "Arrive early to avoid crowds",
  "cost": 0,
  "category": "SIGHTSEEING",
  "bookingLink": null
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `title` | Yes | Non-blank |
| `startTime` | Yes | Format: `HH:mm:ss` |
| `location` | Yes | Non-blank |
| `notes` | Yes | Non-blank |
| `cost` | No | Decimal number |
| `category` | No | See categories below |
| `bookingLink` | No | Free text |

**Activity categories:** `TRANSPORT`, `ACCOMMODATION`, `FOOD`, `SIGHTSEEING`, `ACTIVITY`, `SHOPPING`, `OTHER`

**Response `201 Created`:** An `ActivityResponse` object.

Publishes a WebSocket event to all trip members on success.

---

### Update Activity
**PATCH** `/trips/{tripId}/itinerary/days/{dayId}/activities/{activityId}`

Partial update — only fields included in the body are changed.

**Request body (all fields optional):**
```json
{
  "title": "Visit Senso-ji Temple (updated)",
  "startTime": "10:00:00",
  "cost": 5.00
}
```

**Response `200 OK`:** Updated `ActivityResponse` object.

Publishes a WebSocket event to all trip members on success.

---

### Delete Activity
**DELETE** `/trips/{tripId}/itinerary/days/{dayId}/activities/{activityId}`

**Response `204 No Content`**

Publishes a WebSocket event to all trip members on success.

---

## 7. WebSocket

Connect using STOMP over SockJS at:
```
ws://localhost:8080/api/v1/ws
```

**Authentication:** Send the JWT token in the STOMP `CONNECT` frame header:
```
Authorization: Bearer <accessToken>
```

**Subscribe to trip events:**
```
/topic/trips/{tripId}
```

All messages on this topic are `TripEvent` objects:
```json
{
  "type": "TRIP_UPDATED",
  "tripId": "3fa85f64-...",
  "payload": { ... },
  "actorId": "3fa85f64-...",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

| Event type | Triggered by | Payload |
|------------|-------------|---------|
| `TRIP_UPDATED` | PATCH `/trips/{id}` | Full `TripResponse` |
| `MEMBER_ADDED` | Accept invite | `{ userId, role }` |
| `MEMBER_REMOVED` | DELETE `/trips/{id}/members/{memberId}` | `{ userId }` |
| `MEMBER_LEFT` | DELETE `/trips/{id}/members/me` | `{ userId }` |
| `DAY_ADDED` | POST `.../days` | Full `DayResponse` |
| `DAY_DELETED` | DELETE `.../days/{dayId}` | `{ dayId }` |
| `ACTIVITY_ADDED` | POST `.../activities` | Full `ActivityResponse` |
| `ACTIVITY_UPDATED` | PATCH `.../activities/{id}` | Full `ActivityResponse` |
| `ACTIVITY_DELETED` | DELETE `.../activities/{id}` | `{ activityId, dayId }` |

---

## 8. Error Responses

All errors return this shape:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable description",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

| Status | Meaning | Common causes |
|--------|---------|---------------|
| `400` | Bad Request | Missing/invalid request body, validation failure |
| `401` | Unauthorized | Missing, invalid, or expired JWT token |
| `403` | Forbidden | Valid token but insufficient role (e.g. VIEWER trying to edit) |
| `404` | Not Found | Trip, day, activity, or invite not found |
| `409` | Conflict | Email already registered, duplicate pending invite, duplicate day date |
| `500` | Internal Server Error | Unexpected server error |

---

## Postman Quick Setup

1. **Register or login** via `/auth/register` or `/auth/login`
2. Copy the `accessToken` from the response
3. On every protected request: **Authorization tab → Type: Bearer Token → paste the token**
4. For any `POST` / `PATCH` with a body: **Body tab → raw → JSON** (the dropdown next to the format selector)
5. Access tokens expire — re-login to get a fresh one if you start getting `401`
