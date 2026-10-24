# Bytebeam Fleet Management Dashboard

A fleet operations dashboard built with **React, TypeScript, Vite, Supabase, and React Leaflet**. The application provides an interactive overview of vehicles, trips, alerts, and fleet performance, with authentication and persistent data support.

## Live Demo

**Deployment URL:** `https://YOUR-DEPLOYMENT-URL.vercel.app`

> Replace the placeholder with your actual deployed application URL.

## Overview

Bytebeam Fleet Management Dashboard is a frontend-focused fleet operations prototype designed to help operations teams monitor vehicles and review fleet activity through a centralized interface.

### Key Features

- **Authentication:** Email and password sign-up, sign-in, logout, and protected dashboard access.
- **Email Confirmation:** Supabase email verification for newly registered accounts.
- **Fleet Overview:** Summary cards displaying fleet status and operational information.
- **Interactive Map:** OpenStreetMap-based map displaying vehicle locations and representative routes.
- **Vehicle Management:** Search, filter, and inspect vehicle information.
- **Trip Management:** Review trip details, routes, distance, duration, and speed information.
- **Alerts:** View operational alerts, including vehicle status and fuel-related conditions.
- **Vehicle Details:** Inspect location, speed, fuel, battery, ignition, health, and daily usage.
- **Data Export:** Export available demo data as JSON.
- **Demo Mode:** Explore the dashboard using sample data without creating an account when Supabase is not configured.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Component-based frontend |
| TypeScript | Type safety |
| Vite | Development server and build tool |
| Supabase Auth | User authentication |
| Supabase PostgreSQL | Persistent application data |
| React Leaflet | Interactive map |
| OpenStreetMap | Map tiles |
| Lucide React | Interface icons |
| CSS | Responsive styling |

## Application Pages

### Overview
Provides a fleet summary, operational statistics, vehicle map, and selected vehicle information.

### Vehicles
Displays vehicle records with search, status filtering, and vehicle details.

### Trips
Displays trip records with relevant vehicle, driver, route, distance, duration, and speed information.

### Alerts
Displays fleet alerts and operational attention signals.

### Settings
Displays workspace and backend connection information.

## Authentication

Authentication is implemented using **Supabase Auth**.

### Sign Up

1. Open the application.
2. Select **Sign Up**.
3. Enter your email address and password.
4. Confirm your password.
5. Select **Create account**.
6. If email confirmation is enabled, check your inbox for the Supabase verification email.
7. Open the verification link to confirm your email address.
8. Return to the application and sign in.

New accounts may require email verification before they can sign in, depending on the Supabase project's authentication settings.

### Email Confirmation

Email confirmation is handled by Supabase Auth.

To enable email confirmation:

1. Open your Supabase project.
2. Navigate to **Authentication → Providers**.
3. Select the Email provider.
4. Enable email confirmation.
5. Configure the email confirmation template if required.
6. Ensure the application's URL is included in the appropriate Supabase redirect URL configuration.
7. Save the settings.

For local development, configure the appropriate local application URL. For deployment, configure the production application URL.

If email confirmation is enabled, users should verify their email before signing in. If confirmation is disabled, Supabase may allow users to sign in immediately after registration.

### Sign In

1. Open the application.
2. Enter the registered email address.
3. Enter the password.
4. Select **Sign In**.

Authenticated users can access the dashboard.

### Logout

Users can log out from the dashboard. After logout, protected dashboard access requires authentication again.

### Protected Routes

The application checks the Supabase authentication session and protects dashboard access from unauthenticated users.

### Demo Access

When Supabase environment variables are not configured, the application provides an **Explore Demo Dashboard** option using local sample data.

Demo mode is intended for evaluation and does not require a real user account.

## Local Setup

### Prerequisites

- Node.js 20 or later
- npm
- A Supabase project for authentication and database functionality

### 1. Clone or Extract the Project

Open the project directory:

```bash
cd bytebeam-fleet-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

Copy the example configuration:

```bash
cp .env.example .env
```

Add your Supabase project credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use the Supabase project URL and public anon key from your project's API settings.

Do not include service-role keys or other privileged secrets in frontend environment variables.

### 4. Start the Development Server

```bash
npm run dev
```

Open the local URL provided by Vite.

Usually:

```text
http://localhost:5173
```

### 5. Build the Application

```bash
npm run build
```

### 6. Preview the Production Build

```bash
npm run preview
```

## Supabase Setup

### 1. Create a Supabase Project

Create a project through the Supabase dashboard.

### 2. Configure Environment Variables

Navigate to:

**Project Settings → API**

Copy the project URL and public anon key into your `.env` file.

### 3. Create the Database Schema

Open:

**SQL Editor**

Run the SQL script:

```text
supabase/schema.sql
```

This creates the database tables and relationships required by the application.

### 4. Insert Sample Data

Run:

```text
supabase/seed.sql
```

The seed script provides sample drivers, vehicles, trips, and related records for the prototype.

### 5. Configure Authentication

Navigate to:

**Authentication → Providers → Email**

Enable email authentication.

Configure email confirmation according to the desired authentication flow.

### 6. Configure Redirect URLs

Navigate to the authentication URL configuration settings.

Add the local development URL and deployed application URL as appropriate.

Ensure that email confirmation redirects to a valid application URL.

### 7. Create a Reviewer Account

A reviewer can:

1. Open the deployed application.
2. Select Sign Up.
3. Register using an email address.
4. Confirm the email if verification is enabled.
5. Sign in using the registered credentials.

Alternatively, a reviewer account can be created through Supabase Auth if required.

The evaluator does not need access to the Supabase dashboard to use the deployed application.

### 8. Restart the Development Server

After changing environment variables:

```bash
npm run dev
```

## Database Design

The application uses PostgreSQL through Supabase.

### Drivers

Stores driver information.

Typical fields:

- Driver ID
- Driver name
- Contact number

### Vehicles

Stores vehicle identity and operational information.

Typical fields:

- Vehicle ID
- Vehicle name
- Registration number
- Assigned driver
- Operational status
- Latitude and longitude
- Speed
- Fuel level
- Battery level
- Ignition status
- Last-seen timestamp
- Daily distance
- Daily trip count
- Vehicle health score

### Trips

Stores trip records.

Typical fields:

- Trip ID
- Vehicle ID
- Driver ID
- Start location
- End location
- Start coordinates
- End coordinates
- Start timestamp
- End timestamp
- Distance
- Duration
- Average speed
- Maximum speed
- Halt count
- Overspeed count

### Telemetry

Stores vehicle telemetry records for future route-history and monitoring functionality.

Typical fields:

- Telemetry ID
- Vehicle ID
- Timestamp
- Latitude
- Longitude
- Speed
- Fuel level
- Battery level
- Ignition status

### Relationships

```text
Drivers
  |
  | driver_id
  v
Vehicles
  |
  | vehicle_id
  v
Trips

Vehicles
  |
  | vehicle_id
  v
Telemetry
```

Database relationships:

- `vehicles.driver_id → drivers.id`
- `trips.vehicle_id → vehicles.id`
- `trips.driver_id → drivers.id`
- `telemetry.vehicle_id → vehicles.id`

The actual column definitions are available in the SQL files inside the `supabase` directory.

## Data and Demo Limitations

This project is a fleet management prototype.

- Vehicle locations use seeded coordinates in the Kochi area.
- Vehicle telemetry is sample data, not a live device feed.
- The map displays representative vehicle routes.
- The prototype does not receive real GPS data.
- There is no real-time vehicle tracking integration.
- There is no dispatch or vehicle-control functionality.
- Telemetry is included as a foundation for future route-history functionality.

The dashboard is intended to demonstrate fleet operations UI, data presentation, authentication, and database integration.

## Security and Database Policies

Supabase Row Level Security (RLS) policies are used to control database access.

The prototype uses authenticated-read policies to simplify reviewer access.

For production deployment, additional security controls would be recommended:

- Organization and workspace membership.
- Tenant-scoped database policies.
- Role-based access control.
- Write permissions restricted by role.
- Stronger separation between administrators and ordinary users.
- Production-ready account and access management.

Never expose Supabase service-role credentials in the frontend.

## Technical Architecture

```text
React + TypeScript Frontend
          |
          v
      Supabase JS
          |
    +-----+------+
    |            |
    v            v
 Supabase Auth  PostgreSQL
                  |
       +----------+----------+
       |          |          |
       v          v          v
    Drivers     Vehicles     Trips
                              |
                              v
                          Telemetry
```

### Frontend

React components provide the dashboard, navigation, vehicle tables, trip tables, alerts, and settings.

### Authentication

Supabase Auth manages user registration, email confirmation, sessions, and sign-in.

### Database

Supabase PostgreSQL stores fleet records and related information.

### Map

React Leaflet displays vehicle locations and route polylines using OpenStreetMap tiles.

## Design Decisions

- **React and TypeScript:** Provide reusable components and typed application data.
- **Vite:** Provides a lightweight development and production build workflow.
- **Supabase:** Combines authentication and PostgreSQL data storage.
- **Normalized database structure:** Drivers, vehicles, trips, and telemetry are stored separately.
- **React Leaflet:** Provides interactive maps without requiring a paid map API key for the prototype.
- **Seeded data:** Allows the dashboard to be explored without connected vehicle hardware.
- **Demo mode:** Allows basic application exploration without Supabase configuration.

## Deployment

The application can be deployed using Vercel or another static frontend hosting provider that supports Vite.

### Vercel Deployment

1. Create a Vercel account.
2. Import the project using the supported deployment workflow.
3. Select Vite as the framework preset.
4. Set the build command:

   ```bash
   npm run build
   ```

5. Set the output directory:

   ```text
   dist
   ```

6. Configure the environment variables:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

7. Deploy the application.
8. Configure the deployed URL in Supabase authentication settings.
9. Test registration, email confirmation, sign-in, logout, and dashboard access.
10. Update the Live Demo URL at the top of this README.

## AI Usage

AI assistance was used during development to support:

- Initial dashboard structure and component organization.
- Sample fleet data.
- Database schema and seed data preparation.
- UI styling and layout refinement.
- Authentication implementation support.
- README documentation.

Generated code and recommendations were reviewed and adapted during development.

AI conversation exports or shareable conversation links should be included in the submission under:

```text
ai-logs/AI_CHAT_LOGS.md
```

Include the actual exported logs or links before submitting the project.

## Project Structure

```text
bytebeam-fleet-dashboard/
│
├── public/
│
├── src/
│   ├── components/
│   ├── data.ts
│   ├── supabase.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
│
├── supabase/
│   ├── schema.sql
│   └── seed.sql
│
├── ai-logs/
│   └── AI_CHAT_LOGS.md
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── ...
```

The structure above represents the intended organization. Actual files may vary depending on the project implementation.

## Future Improvements

- Live GPS integration.
- Real-time telemetry updates.
- Historical route playback.
- Advanced alert filtering.
- Organization-level access control.
- Role-based permissions.
- Fleet analytics and reporting.
- Vehicle maintenance tracking.
- Improved mobile dashboard experience.

## Submission Checklist

- [ ] Complete Supabase configuration.
- [ ] Verify database schema and seed data.
- [ ] Test account registration.
- [ ] Test email confirmation.
- [ ] Test sign-in and logout.
- [ ] Verify protected dashboard access.
- [ ] Test vehicle search and filters.
- [ ] Test trip details.
- [ ] Test alerts.
- [ ] Test map and vehicle markers.
- [ ] Test settings.
- [ ] Test the application at desktop and mobile widths.
- [ ] Run `npm run build`.
- [ ] Add the deployed application URL.
- [ ] Include AI conversation logs or shareable links.
- [ ] Create the submission ZIP.
- [ ] Exclude `node_modules`, build output, and unnecessary caches.
- [ ] Ensure the ZIP is under 100 MB.
- [ ] Upload the ZIP through the assignment submission form.

## Author

Bytebeam Fleet Management Dashboard

**Built with React, TypeScript, Vite, Supabase, and React Leaflet.**