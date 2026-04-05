# ServiceCall — Architecture & Developer Guide

## Overview

ServiceCall is a React 19 + TypeScript web application that connects homeowners and business owners with reliable local blue-collar service professionals. Users can discover nearby providers, compare ratings and pricing, submit service requests, and track jobs from request to completion.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 with React Compiler |
| Language | TypeScript (strict mode) |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Backend | Firebase (Auth + Firestore) |
| Testing | Vitest + React Testing Library |
| Linting | ESLint 9 + typescript-eslint |
| Formatting | Prettier |

---

## Project Structure

```
/src
  /components        # React components (one per file, filename = component name)
  /hooks             # Custom React hooks + context providers
  /services          # Firebase & external API calls (never import Firebase in components)
  /types             # TypeScript interfaces and types
  /utilities         # Pure functions and helpers (no side effects)
  /test              # Global test setup (setup.ts)

/docs                # Architecture notes, API specs, developer guides
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy `.env.example` to `.env.local` and fill in your Firebase project credentials:

```bash
cp .env.example .env.local
```

Create a Firebase project at https://console.firebase.google.com and:
- Enable **Authentication → Google Sign-In**
- Create a **Firestore** database in production mode
- Copy the web app config values into `.env.local`

### 3. Run the development server

```bash
npm run dev
```

### 4. Run tests

```bash
npm test          # single run
npm run test:watch  # watch mode
```

### 5. Lint and format

```bash
npm run lint
npm run format
```

---

## Firebase Collections

### `providers`
Stores service provider profiles.

```ts
interface ServiceProvider {
  id: string;            // Firestore document ID
  name: string;
  category: string;      // matches ServiceCategory.id
  rating: number;        // 0–5
  reviewCount: number;
  hourlyRate: number;    // USD
  available: boolean;
  location: string;      // human-readable area
  distanceMiles: number; // from user (updated dynamically in production)
  imageUrl: string;
  specialties: string[];
}
```

### `serviceRequests`
Tracks job requests from users.

```ts
interface ServiceRequest {
  id: string;
  userId: string;         // Firebase Auth UID
  providerId: string;     // references providers collection
  categoryId: string;
  description: string;
  status: ServiceRequestStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  scheduledAt?: Timestamp;
  address: string;
  estimatedCost?: number;
}

type ServiceRequestStatus =
  | "pending"
  | "accepted"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled";
```

### `bookmarks`
Stores saved providers per user.

```ts
interface Bookmark {
  id: string;
  userId: string;
  providerId: string;
  createdAt: Timestamp;
}
```

---

## Routing

| Path | Component | Description |
|---|---|---|
| `/` | `Home` | Main feed: search, promo, categories, popular services |
| `/discover` | `Discover` | Browse & filter all providers |
| `/provider/:id` | `ProviderDetail` | Provider profile + book action |
| `/request` | `Request` | New service request form |
| `/bookmarks` | `Bookmarks` | Saved providers |
| `/account` | `Account` | Profile, job history, settings |

---

## Authentication Flow

1. `AuthProvider` (in `hooks/useAuth.tsx`) wraps the entire app
2. On mount, `onAuthStateChanged` fires and sets `user` state
3. `useAuth()` hook exposes `{ user, loading }` to any component
4. `Account` page handles sign-in via `signInWithGoogle()` from `authService.ts`
5. All Firebase Auth calls live exclusively in `services/authService.ts`

---

## State Management

- **Auth state**: React Context via `AuthProvider` / `useAuth()`
- **UI state**: Local `useState` within each page component
- **Server state**: Custom hooks (`useProviders`) with loading/error handling
- No global state manager — complexity does not warrant it at this scale

---

## Code Conventions

- `const` by default; `let` only when reassignment is required
- `async/await` everywhere; wrapped in `try/catch`
- Arrow functions for all components and callbacks
- Named exports only (no default exports except `App`)
- TypeScript infers component return types
- `interface` for object shapes in `/src/types/`
- No `any` — use `unknown` + type narrowing when type is genuinely unknown
- No inline `style` overrides — use Tailwind utility classes
- No direct Firebase SDK imports inside `/components/`

---

## Testing Conventions

- Test files are colocated: `ComponentName.test.tsx` / `module.test.ts`
- Query by role, label, or text — test IDs only as a last resort
- All Firebase and network calls are mocked with `vi.mock()`
- Import all functions and types explicitly by name
- Tests must pass before any task is complete (`npm test`)

---

## Seeding Firestore (Development)

For local development the app uses `MOCK_PROVIDERS` and `MOCK_CATEGORIES` from `src/utilities/mockData.ts` so no live Firestore connection is required to explore the UI.

To seed a real Firestore instance, run the following from the Firebase console or a one-off Node script:

```ts
import { MOCK_PROVIDERS } from "./src/utilities/mockData";
import { db } from "./src/services/firebase";
import { collection, addDoc } from "firebase/firestore";

for (const provider of MOCK_PROVIDERS) {
  const { id: _id, ...data } = provider;
  await addDoc(collection(db, "providers"), data);
}
```

---

## Recommended Next Steps

1. **Geolocation** — Replace static `distanceMiles` with real coordinates using the browser Geolocation API + Haversine formula
2. **Real-time job tracking** — Use Firestore `onSnapshot` listeners in a `useJobStatus` hook for live status updates
3. **Push notifications** — Integrate Firebase Cloud Messaging for job status alerts
4. **Image uploads** — Add Firebase Storage for provider profile photos
5. **Reviews** — Add a `reviews` collection and a `ReviewCard` component on `ProviderDetail`
6. **Stripe payments** — Integrate via a Firebase Cloud Function to keep keys server-side
