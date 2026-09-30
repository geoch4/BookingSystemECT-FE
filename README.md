# ECT/rTMS Booking System - Frontend

This project is the frontend of a booking and referral system for ECT and rTMS treatments. It helps healthcare staff register referrals, prioritize patients, schedule treatments, and monitor the daily treatment workflow.

The application is built with React, TypeScript, and Vite. It communicates with a separate backend through a REST API.

## What are ECT and rTMS?

**ECT (electroconvulsive therapy)** is a treatment in which the brain is stimulated with a short electrical impulse while the patient is under anesthesia. It is mainly used for severe depression and other serious psychiatric conditions.

**rTMS (repetitive transcranial magnetic stimulation)** uses magnetic pulses to stimulate selected areas of the brain. The patient remains awake during treatment, and the method is used for conditions such as depression.

## Features

- JWT-based authentication
- Role-based home page
- Three-step referral registration
- Booking management and prioritization
- Daily ECT and rTMS overview
- Patient registry
- Guidelines, procedures, and checklists
- Statistics and quality monitoring
- User management for administrators
- Swedish and English language support

## Technology

- React 19
- TypeScript
- Vite
- React Router
- TanStack React Query
- Axios
- Tailwind CSS
- Vitest and Testing Library
- Playwright

## Prerequisites

To run the project, you need:

- Node.js and npm
- The project backend running at `http://localhost:5000`

The frontend forwards local `/api` requests to the backend through the Vite proxy configured in `vite.config.ts`.

## Getting Started

1. Open a terminal in the project root directory.
2. Install the dependencies:

```bash
npm install
```

3. Start the backend on port `5000`.
4. Start the frontend:

```bash
npm run dev
```

5. Open the address shown in the terminal, normally:

```text
http://localhost:5173
```

You will automatically be redirected to the login page if you do not have a valid session.

## Authentication and Authorization

During login, the email address and password are sent to:

```text
POST /api/auth/login
```

The backend returns a JWT token, which is stored in the browser. The token is then automatically included in later API requests.

The user's role is read from the token and controls which features are displayed on the home page. The administration page is protected and can only be opened by a user with the `Admin` role.

New user registration is available on the login page, but it depends on backend permissions and normally requires administrator authorization.

## Application Workflow

### 1. Sign in

The user signs in with their account. After a successful login, the token is stored and the user is taken to the home page.

### 2. Role-based home page

The home page presents the current ECT and rTMS situation. Its content is adapted to the user's role, such as coordinator, doctor, or anesthesia nurse.

From the home page, users can open:

- New referral
- Priority list
- Daily treatment schedule
- Guidelines and documents
- Statistics and quality monitoring

### 3. Create a referral

A new referral is created in three steps:

1. **Patient** - search for an existing patient or register a new one.
2. **Treatment and priority** - select an ECT/rTMS treatment type, priority, date, time, and referring department.
3. **Health declaration** - enter details such as fasting status, blood pressure, weight, allergies, and medication.

If the patient is new, the patient record is created first. The booking is then created with the `Pending` status.

### 4. Prioritize and manage the booking

The priority list displays bookings with their patient, treatment, department, priority, and status.

Users can:

- filter bookings by status
- create or edit a booking
- change its priority and status
- view locally stored change history
- cancel or delete a booking

The system prevents two active bookings from being assigned to the same time slot.

### 5. Daily treatment schedule

The dashboard places the day's bookings into ECT and rTMS time slots. Staff can view the patient, treatment, referring department, and current status.

Status changes are sent to the backend, and React Query automatically refreshes the affected information.

### 6. Follow-up

The statistics page presents key metrics, improvement areas, and quality registry information. The documents page contains procedures, guidelines, checklists, and referral pathways.

## Main Routes

| Route | Content |
| --- | --- |
| `/login` | Login and registration |
| `/` | Role-based home page |
| `/dashboard` | Daily ECT and rTMS schedule |
| `/rtms` | rTMS view |
| `/bokning` | Create a new referral |
| `/prioritering` | Manage and prioritize bookings |
| `/patients` | Patient registry |
| `/dokument` | Guidelines and documents |
| `/statistik` | Statistics and quality monitoring |
| `/admin` | User administration, admin only |

English route aliases are also available, including `/bookings`, `/referral`, and `/documents`.

## API and Data Flow

The API functions are located in `src/api` and share a common Axios client:

```text
React component
    -> React Query
    -> Axios client
    -> /api
    -> Vite proxy
    -> Backend at localhost:5000
```

React Query is used to fetch, cache, and update data. After a change, the affected cache, such as `bookings`, is invalidated so the interface retrieves the latest information.

Some additional referral metadata and change history may be stored in the browser's `localStorage` for compatibility with backend versions that do not provide these fields.

## Project Structure

```text
src/
|-- api/          API requests for authentication, bookings, patients, and users
|-- components/   Reusable components and application layout
|-- config/       Configuration, including demo mode
|-- context/      Authentication and language state
|-- hooks/        Reusable React hooks
|-- pages/        Application pages
|-- test/         Unit and component tests
|-- types/        TypeScript types and treatment definitions
`-- utils/        Helper functions, local metadata, and history

e2e/              End-to-end and accessibility tests
```

## Available Commands

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Type-checks the project and creates a production build in `dist`.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Checks the code with ESLint.

```bash
npm test
```

Runs unit and component tests with Vitest.

```bash
npm run test:e2e
```

Runs end-to-end and accessibility tests with Playwright. Playwright's browser may need to be installed before the first run:

```bash
npx playwright install
```

## Demo Mode

The project supports additional demo data in some booking views. In development, demo mode is enabled by default unless you set it to `false`.

Create a `.env.local` file in the project root when you want to override local settings:

```env
VITE_ENABLE_DEMO_DATA=true
VITE_DEV_API_PROXY_TARGET=http://localhost:5000
```

For production deploys, use:

```env
VITE_ENABLE_DEMO_DATA=false
VITE_API_BASE_URL=/api
```

If the backend is hosted separately, set `VITE_API_BASE_URL` to the backend API base URL instead of `/api`.

Demo mode does not replace authentication or every backend request. The backend is still required for the complete application workflow.

## MVP Scope

The current MVP assessment is documented in [`docs/mvp-audit.md`](docs/mvp-audit.md). In short, the MVP should focus on the core flow: create referral, review/prioritize, book a treatment slot, and show the booked time in the daily schedule.

## Future Plan

The goal is for each department to have its own login. A department will create a referral and request ECT treatment for a patient.

The referral cannot be submitted until all required documents and patient information have been provided. The ECT unit will then receive the referral, review the information, and assign an available treatment slot.

When the patient has received an appointment, the system will send an email notification to the referring department with the booking details.
