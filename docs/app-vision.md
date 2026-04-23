# ServiceCall

## Name
- The app is called **ServiceCall**.

## Users
- Homeowners needing urgent or scheduled services (e.g., plumbing, electrical, cleaning)
- Business owners managing property maintenance
- Local service providers offering blue-collar services
- And this

## Value Proposition
A fast, reliable way to connect users with the right local service professionals exactly when they need them, eliminating endless searching and uncertainty.

## Key Features

### Simple Mobile-Friendly Interface
- Location displayed at the top
- Search bar for quick service lookup
- Featured offer banner
- Categories section for quick navigation
- Popular services list with ratings and pricing

### Request a Service
- Users can request a service with one tap
- Instantly connects to nearby service providers
- No need for manual searching or calling

### Compare Providers
- View ratings, pricing, and availability
- Make quick, informed decisions

### Track Service Requests
- Real-time status updates:
  - Pending
  - Accepted
  - In Progress
  - Completed
- Notifications for each stage of the job

### Service Categories
- Plumbing
- Electrical
- Cleaning
- Repair
- Excavation

### Navigation
- Bottom navigation includes:
  - Home
  - Discover
  - Chat
  - Bookmarks
  - Account

## Example Scenario
- John discovers a leaking pipe in his kitchen.
- He opens the ServiceCall app.
- The home screen shows nearby services and categories.
- John selects **Plumbing**.
- He sees a list of available plumbers with ratings and prices.
- He taps on a provider and clicks **Request Service**.
- The request is submitted instantly.
- A nearby plumber accepts the request.
- John receives a notification that the job is in progress.
- The plumber arrives and fixes the issue.
- The job is marked completed, and John can review the service.

## Coding Notes

### Tech Stack
- React (functional components with hooks)
- TypeScript (strict mode)
- Vite
- Tailwind CSS
- Firebase (Authentication + Firestore)

### Architecture Rules
- All Firebase calls must live in `/src/services/`
- Components must not directly call Firebase
- Use custom hooks for logic and data fetching
- Use React Context for shared state

### Data Handling
- Firestore collections:
  - users
  - services
  - requests
- Use async/await with try/catch for all async operations

### UI Guidelines
- Mobile-first design
- Clean and minimal interface
- Fast, low-friction interactions
- Clear call-to-action buttons

## Testing Notes

### Framework
- Vitest + React Testing Library

### Required Test Cases

#### Service Requests
- Request creation stores correct data
- Request status updates correctly

#### UI Behavior
- “Request Service” button disables while loading
- Error messages display correctly

#### Data Fetching
- Services load correctly from Firestore
- Loading and error states render properly

#### Navigation
- Bottom navigation switches views correctly

## Future Enhancements
- Real-time chat between users and providers
- Smart matching based on location and availability
- Advanced filters (price, urgency, rating)
- Payment integration
- Reviews and rating system