# ShareShelf

**ShareShelf is a student-focused sharing platform** that helps campus
communities make better use of resources by borrowing, lending, buying,
selling, and offering useful services to one another.

Repository:
[LunarCoder-Chandni/ShareShelf](https://github.com/LunarCoder-Chandni/ShareShelf)

## The Problem

Students often need items for a short period---such as textbooks, lab
coats, drawing sheets, or project equipment---or want affordable access
to skills and services. At the same time, other students may have unused
items or skills they can share.

ShareShelf brings these needs together in one place.

## Core Modules

### 1. Borrow & Lend

Students can list items that others may borrow temporarily, helping
reduce unnecessary purchases and making better use of existing
resources.

### 2. Student Services

Students can discover services and skills offered by other students,
with price-based discovery to help them find options that fit their
budget.

### 3. Buying & Selling

A space for students to list and discover items for permanent sale,
including academic materials and project supplies.

## Features

-   Student account registration and login
-   Listings for items and student services
-   Search and filtering for discovering relevant listings
-   Borrowing, lending, and request-related API modules
-   User profiles, reviews, and safety-related API modules
-   Supabase integration for authentication and backend data
-   Responsive browser-based interface

> Feature availability depends on the current prototype and its
> configured Supabase database. This project is under active
> development.

## Tech Stack

-   **Frontend:** HTML, CSS, JavaScript
-   **Backend:** Node.js, Express.js
-   **Authentication and data services:** Supabase
-   **Validation:** Zod
-   **Middleware and security:** CORS, Helmet, Morgan, Express Rate
    Limit
-   **Database setup:** SQL schema and seed scripts in `database/`

## Project Structure

``` text
ShareShelf/
├── backend/
│   ├── auth/            # Signup, login, and authentication routes
│   ├── config/          # Environment and Supabase configuration
│   ├── listing/         # Item listing APIs
│   ├── need/            # Need/request discovery APIs
│   ├── profile/         # Student profile APIs
│   ├── request/         # Requests related to listings
│   ├── review/          # Reviews
│   ├── safety/          # Safety-related features
│   ├── serviceListing/  # Student service listings
│   ├── middleware/      # Authentication, validation, error handling
│   ├── server.js        # Express application entry point
│   ├── package.json
│   └── .env.example
├── database/
│   ├── schema.sql       # Database schema
│   ├── seed.sql         # Optional sample data
│   └── id.sql
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── auth.js
│   ├── style.css
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

Install:

-   [Node.js](https://nodejs.org/) (version 18.18 or newer recommended)
-   npm (included with Node.js)
-   A [Supabase](https://supabase.com/) project

### 1. Clone the repository

``` bash
git clone https://github.com/LunarCoder-Chandni/ShareShelf.git
cd ShareShelf
```

### 2. Configure Supabase

1.  Create or open your Supabase project.
2.  In the `backend` directory, copy `.env.example` to `.env`.
3.  Fill in the required values using your own Supabase project
    settings.

Example variable names (use the exact names from
`backend/.env.example`):

``` env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_SERVICE_ROLE_KEY
ALLOWED_EMAIL_DOMAINS=
SUPABASE_STORAGE_BUCKET=shareshelf-images
```

**Security:** Never commit `.env` files or expose the Supabase
service-role key in frontend code, screenshots, or public repositories.
Keep privileged keys on the backend only. If a secret was accidentally
uploaded or shared, rotate it in Supabase.

### 3. Set up the database

Use the Supabase SQL Editor to review and run the SQL scripts in the
`database/` folder. Apply `schema.sql` first. Run `seed.sql` only if you
want the sample data it provides. Review the scripts and adapt them to
your Supabase project before executing them.

### 4. Install backend dependencies

Open a terminal at the repository root, then run:

``` bash
cd backend
npm install
npm run dev
```

The API should start on `http://localhost:5000`.

Health check:

``` text
http://localhost:5000/api/health
```

A successful response should look like:

``` json
{"status":"ok"}
```

### 5. Run the frontend

Open a **second terminal** at the repository root:

``` bash
cd frontend
npm install
npm run dev
```

Then open:

``` text
http://localhost:5173
```

Keep both terminals running while using the development setup.

## Environment Configuration

The backend reads configuration from `backend/.env`. The exact required
variables are defined in `backend/config/env.js` and
`backend/.env.example`.

-   `SUPABASE_URL`: your Supabase project URL
-   `SUPABASE_ANON_KEY`: the public/anonymous key used by the Supabase
    client
-   `SUPABASE_SERVICE_ROLE_KEY`: a privileged secret used only by the
    backend
-   `PORT`: backend port (defaults to `5000`)
-   `CLIENT_ORIGIN`: allowed frontend origin(s)
-   `ALLOWED_EMAIL_DOMAINS`: optional comma-separated email domains, if
    college-email restrictions are desired
-   `SUPABASE_STORAGE_BUCKET`: storage bucket name (defaults to
    `shareshelf-images`)

Do not put service-role keys in `frontend/` files or expose them to the
browser.

## API Overview

The Express server mounts these API groups:

  -----------------------------------------------------------------------
  Base path                           Purpose
  ----------------------------------- -----------------------------------
  `/api/health`                       Backend health check

  `/api/auth`                         Signup, login, session refresh, and
                                      current-user authentication

  `/api/profiles`                     Student profile operations

  `/api/listings`                     Item listing operations

  `/api/needs`                        Needs and discovery operations

  `/api/requests`                     Listing-related requests

  `/api/reviews`                      Reviews

  `/api/safety`                       Safety-related operations

  `/api/services`                     Student service listings
  -----------------------------------------------------------------------

Check the route files under `backend/` for the current methods,
payloads, and required authentication. Endpoints may evolve as the
prototype develops.

## Current Status

ShareShelf is a prototype being developed for a student-focused sharing
experience. Some features may require additional database configuration,
Supabase storage setup, or further testing before production use.

## Roadmap Ideas

-   Improve the end-to-end signup and login experience
-   Add clearer listing availability and request status tracking
-   Improve item handover and return workflows
-   Expand moderation, reporting, and trust features
-   Add stronger automated tests and deployment documentation

## Contributing

Contributions and suggestions are welcome.

1.  Fork the repository.
2.  Create a branch for your change.
3.  Make and test your changes locally.
4.  Commit with a descriptive message.
5.  Open a pull request.

Please do not commit credentials, `.env` files, or private user data.

## Team

Built as a student project focused on making campus resources more
accessible, affordable, and reusable.

## License

No license is specified here. Add a `LICENSE` file if you intend to
grant others explicit permission to reuse, modify, or distribute the
project.

## Colaborators
Sneha- https://github.com/nova-sneha
Divyanka- https://github.com/divyankapandey13-max
