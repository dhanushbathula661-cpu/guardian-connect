# Guardian Connect

Build PHOENIX — Smart Public Safety & Emergency Response System

Build a complete, production-quality, full-stack web application named:

PHOENIX

Smart Public Safety & Emergency Response System

PHOENIX is a modern public-safety platform designed to help users quickly respond to emergencies, send SOS alerts, share their live location, report incidents, contact emergency services, and receive timely assistance.

This must be a fully functional, dynamic, database-connected application, not a static frontend prototype.

The final application should feel like a modern real-world safety platform/startup product, with excellent UI/UX, smooth animations, responsive design, accessibility, security, and reliable backend functionality.

1. CORE PRODUCT VISION

The central idea is:

When every second matters, PHOENIX connects people to help faster.

The application should allow a user to:

Register and securely log in

Manage their profile

Add emergency contacts

Trigger an Emergency SOS

Automatically capture GPS location

Share emergency location

Notify emergency contacts

Report incidents

Upload evidence

Track incident status

Find nearby police stations, hospitals and fire stations

View emergency history

Receive notifications

Administrators should be able to:

Monitor users

Monitor active SOS alerts

View incident reports

Update incident status

Monitor emergency locations

Manage users

View analytics

Manage emergency response data

2. TECHNOLOGY STACK

Use the following stack.

Frontend

React

Vite

TypeScript

Tailwind CSS

React Router

Axios

React Hook Form

Zod

UI

Use:

shadcn/ui

Radix UI primitives where required

Phosphor Icons

Do NOT use random icon libraries.

Use Phosphor Icons consistently throughout the entire application.

Examples:

Shield

Siren

MapPin

Bell

User

Warning

Fire

Hospital

PoliceCar

Phone

NavigationArrow

CheckCircle

WarningCircle

Clock

MagnifyingGlass

Gear

House

FileText

Use appropriate Phosphor icons based on context.

3. ANIMATION SYSTEM

Use TWO animation systems intelligently.

Motion

Use Motion for:

Page transitions

Modal animations

Dialog animations

Card entrance animations

Dropdown animations

Notification animations

Hover interactions

Button feedback

Sidebar transitions

List animations

Dashboard statistic animations

Animations must be subtle and professional.

GSAP

Use GSAP for advanced visual experiences such as:

Landing-page hero animation

Scroll-based animations

Animated background elements

Safety visualization

Dashboard entrance sequences

Map-related visual effects

Emergency response visualization

Number/counter animations where appropriate

Do NOT use GSAP everywhere.

Use Motion for normal UI interaction and GSAP only where advanced animation provides real UX value.

4. ACCESSIBILITY & MOTION

Respect:

prefers-reduced-motion


If the user prefers reduced motion:

Disable unnecessary GSAP effects

Reduce Motion animations

Keep essential feedback

Never make emergency functionality dependent on animation

Animations must never interfere with emergency actions.

5. VISUAL DESIGN SYSTEM

Create a premium safety-tech visual identity.

Primary colors

Use:

Deep navy

Electric blue

Emergency red

White

Neutral gray

Use red ONLY for emergency-related actions and dangerous states.

Do not make the entire website red.

UI style

Use:

Clean cards

Soft borders

Subtle shadows

Glass effects only where appropriate

Rounded corners

Strong typography

Clear hierarchy

Large whitespace

Professional icons

Smooth transitions

Responsive layouts

Avoid:

Overly bright gradients

Excessive animations

Cartoon-like UI

Clutter

Excessive glassmorphism

Huge unnecessary text

Random colors

The application should look like a serious safety platform.

6. BRANDING

Application name:

PHOENIX

Subtitle:

Smart Public Safety & Emergency Response System

Create a minimal PHOENIX logo concept using:

Shield

Phoenix-inspired protection symbol

Emergency signal

Modern geometric styling

The logo should work in:

Navbar

Sidebar

Login screen

Admin dashboard

Mobile navigation

Favicon

7. LANDING PAGE

Create a premium animated landing page.

Sections:

Navbar

Include:

PHOENIX logo

Home

Features

How It Works

Emergency Services

Safety

Login

Get Started

Navbar should become sticky on scroll.

Use Motion for transitions.

Hero Section

Main headline:

When every second matters.

Supporting text:

PHOENIX connects people to emergency assistance through intelligent alerts, location sharing, incident reporting, and real-time safety tools.

Buttons:

Get Started

Explore Safety Features

Include an animated emergency-response visual.

Use GSAP for the hero animation.

Show a visual concept such as:

User
 ↓
SOS
 ↓
Location
 ↓
Emergency Contacts
 ↓
Emergency Response


Make this visual dynamic.

8. FEATURES SECTION

Display feature cards:

Emergency SOS

One-tap emergency assistance.

Live Location

Share current location during emergencies.

Incident Reporting

Report accidents, crimes, hazards and emergencies.

Emergency Contacts

Keep trusted contacts ready.

Nearby Services

Find police, hospitals and fire stations.

Smart Notifications

Receive real-time status updates.

Use Phosphor Icons.

Animate cards using Motion.

9. HOW IT WORKS

Create a four-step section:

01
Create Account

02
Set Emergency Contacts

03
Activate SOS / Report Incident

04
Receive Assistance


Use GSAP scroll animations.

10. USER AUTHENTICATION

Create:

Register

Login

Logout

Forgot Password

Reset Password

Registration fields

Full Name

Email

Phone

Password

Confirm Password

Validation using:

React Hook Form

Zod

Password requirements:

Minimum 8 characters

Uppercase

Lowercase

Number

Special character

11. LOGIN EXPERIENCE

Create a premium split-screen login UI.

Left:

PHOENIX branding and safety message.

Right:

Login form.

Include:

Email

Password

Show/hide password

Remember me

Forgot password

Login button

Register link

Use Motion for form entrance.

12. USER DASHBOARD

Create a modern responsive dashboard.

Header:

Good evening, [User Name]
Your safety is our priority.


Display:

Current location

SOS button

Active alerts

Recent incidents

Emergency contacts

Nearby emergency services

13. DASHBOARD STATISTICS

Display dynamic cards:

Total Reports

Pending Reports

Resolved Reports

Active SOS

Use:

Phosphor Icons

Motion

Animated counters

All statistics MUST come from backend APIs.

Never hard-code dashboard statistics.

14. EMERGENCY SOS

This is the most important feature.

Create a large visually prominent SOS button.

The button must NEVER activate accidentally.

Flow:

SOS Button
      ↓
Confirmation Dialog
      ↓
"Are you sure you want to activate Emergency SOS?"
      ↓
Cancel / Activate
      ↓
Request Location
      ↓
Capture GPS
      ↓
Create SOS Record
      ↓
Notify Emergency Contacts
      ↓
Show Active Emergency Screen


Use shadcn/ui Dialog.

Use Motion for dialog animation.

Use a subtle pulse effect around the SOS button.

Do not create excessive flashing.

15. ACTIVE SOS SCREEN

After activation display:

SOS ACTIVE

Current location

Activation time

Emergency contacts notified

Emergency services

SOS ID

Current response status

Status:

ACTIVE
ACKNOWLEDGED
RESPONDING
RESOLVED
CANCELLED


Provide:

Cancel SOS

Resolve SOS

Require confirmation before cancellation.

16. GPS LOCATION

Use browser Geolocation API.

Capture:

Latitude

Longitude

Accuracy

Timestamp

Display location on Leaflet.

Never fake the user's current location.

If location permission is denied:

Show:

Location access is required to provide accurate emergency assistance.

Provide a retry button.

17. MAP SYSTEM

Use:

Leaflet

OpenStreetMap

Create:

Live Location Map

Show:

Current user

Emergency location

Incident locations

Emergency services

Use different marker icons for:

Police

Hospital

Fire station

Incident

User

Create marker popups.

18. EMERGENCY CONTACTS

Create complete CRUD functionality.

Users can:

Add

Edit

Delete

Set primary contact

Fields:

Name

Relationship

Phone

Email

Priority

Use shadcn/ui:

Dialog

Form

Input

Select

Button

AlertDialog

19. INCIDENT REPORTING

Create a professional report form.

Categories:

Accident

Theft

Fire

Harassment

Suspicious Activity

Medical Emergency

Road Hazard

Missing Person

Other

Fields:

Category

Title

Description

Date

Time

Location

Latitude

Longitude

Image

Video

Additional details

Allow image/video uploads.

Validate file:

Type

Size

Extension

20. INCIDENT STATUS

Use:

SUBMITTED
UNDER_REVIEW
ACKNOWLEDGED
IN_PROGRESS
RESOLVED
REJECTED


Display each status using appropriate shadcn Badge components.

When admin changes status:

Update database.

Create notification.

Show notification to user.

21. INCIDENT HISTORY

Create a beautiful incident-history page.

Include:

Search

Filter

Sort

Pagination

Table columns:

Report ID

Category

Title

Date

Location

Status

Actions

On mobile, transform the table into responsive cards.

22. INCIDENT DETAILS

Create a detailed incident page.

Display:

Report information

Reporter

Category

Description

Location

Map

Uploaded evidence

Status timeline

Admin updates

Created date

Last updated

Use a visual status timeline.

Animate timeline items using Motion.

23. NOTIFICATION SYSTEM

Create a complete notification system.

Types:

SOS

Incident

Status Update

Emergency Service

System

Notification bell should show unread count.

Dropdown:

Recent notifications

Mark as read

Mark all as read

View all

Use Motion for dropdown animations.

24. NEARBY EMERGENCY SERVICES

Create an Emergency Services page.

Categories:

Police

Hospitals

Fire Stations

Ambulance

Each card:

Icon

Name

Address

Distance

Phone

Open/availability information where available

Actions:

Call

View Map

Navigate

25. USER PROFILE

Create:

Profile photo

Full name

Email

Phone

Account creation date

Actions:

Edit profile

Change password

Update profile photo

26. ADMIN LOGIN

Create a separate admin login.

Use role-based authentication.

Roles:

USER
ADMIN


A USER must NEVER access admin routes.

Protect both frontend and backend.

27. ADMIN DASHBOARD

Create a premium command-center style dashboard.

Header:

PHOENIX Safety Command Center

Display:

Total users

Active users

Total incidents

Pending incidents

Resolved incidents

Active SOS alerts

Use Recharts.

Charts:

Incident trends

Incident categories

Resolution rate

SOS activity

Use Motion for dashboard entrance.

28. ADMIN SOS MONITORING

Create a real-time-style SOS monitoring interface.

Display active alerts prominently.

Fields:

SOS ID

User

Phone

Emergency type

Location

Time

Status

Map should display active SOS locations.

Actions:

Acknowledge

Responding

Resolve

Cancel

Use status badges.

29. ADMIN INCIDENT MANAGEMENT

Create:

Search

Filters

Sort

Pagination

Details

Status update

Admin notes

Admin can update:

SUBMITTED
→ UNDER_REVIEW
→ ACKNOWLEDGED
→ IN_PROGRESS
→ RESOLVED


or:

REJECTED


30. ADMIN USER MANAGEMENT

Create user table:

ID

Name

Email

Phone

Role

Status

Created

Actions

Admin can:

View

Activate

Deactivate

View user reports

Use shadcn/ui Data Table patterns.

31. ANALYTICS

Create analytics page.

Display:

Total incidents

Incidents by category

Incidents by date

SOS count

Resolution percentage

Average response/status time where data permits

Use Recharts.

Charts should animate smoothly.

32. DATABASE

Use MySQL.

Tables:

users
emergency_contacts
sos_alerts
sos_status_history
incidents
incident_media
notifications


Use:

Primary keys

Foreign keys

Indexes

Unique constraints

Timestamps

Never store plain-text passwords.

33. BACKEND

Use:

Node.js

Express

TypeScript

JWT

bcrypt

MySQL

Structure:

backend/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── models/
│   ├── validators/
│   ├── utils/
│   ├── config/
│   └── server.ts


Use modular architecture.

34. API

Create REST APIs for:

Auth

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password


Profile

GET /api/users/profile
PUT /api/users/profile
PUT /api/users/password


Contacts

GET /api/emergency-contacts
POST /api/emergency-contacts
PUT /api/emergency-contacts/:id
DELETE /api/emergency-contacts/:id


SOS

POST /api/sos
GET /api/sos/my
GET /api/sos/:id
PUT /api/sos/:id/status
PUT /api/sos/:id/resolve


Incidents

POST /api/incidents
GET /api/incidents/my
GET /api/incidents/:id
PUT /api/incidents/:id
DELETE /api/incidents/:id


Notifications

GET /api/notifications
PUT /api/notifications/:id/read
PUT /api/notifications/read-all


Admin

GET /api/admin/dashboard
GET /api/admin/users
PUT /api/admin/users/:id/status
GET /api/admin/incidents
PUT /api/admin/incidents/:id/status
GET /api/admin/sos
PUT /api/admin/sos/:id/status
GET /api/admin/analytics


35. SECURITY

Implement:

bcrypt password hashing

JWT authentication

HTTP-only cookies where appropriate

Authentication middleware

Role-based authorization

Input validation

SQL injection prevention

CORS

Rate limiting

Secure file upload

File-size limits

MIME validation

Environment variables

Centralized error handling

Never expose:

Passwords

JWT secrets

Database passwords

API keys

36. UI COMPONENT SYSTEM

Build reusable components.

Examples:

Button
Card
Dialog
AlertDialog
Input
Textarea
Select
Badge
DropdownMenu
Sheet
Tabs
Tooltip
Toast
Table
Pagination
Avatar
Skeleton
Progress
Calendar
Command


Prefer shadcn/ui components wherever applicable.

Do not create duplicate UI components unnecessarily.

37. RESPONSIVE DESIGN

Must work perfectly on:

Desktop

Laptop

Tablet

Mobile

Mobile layout:

Bottom navigation where useful

Accessible SOS button

Responsive cards

Responsive forms

Mobile-friendly maps

Collapsible sidebar

Admin dashboard should also work on tablets and smaller screens.

38. MICRO-INTERACTIONS

Use Motion for:

Button hover

Button tap

Card hover

Page transition

Modal entrance

Toast entrance

Sidebar

Tabs

Notification dropdown

List appearance

Keep animations between approximately 150–500ms for normal UI interactions.

Do not over-animate.

39. GSAP PREMIUM EXPERIENCES

Use GSAP only for high-value experiences.

Landing page

Create:

Hero text reveal

Safety visualization

Scroll animation

Feature reveal

Dashboard

Create:

Initial dashboard entrance

Counter animations

Emergency visualization

Create a visual:

USER
  ↓
SOS
  ↓
LOCATION
  ↓
CONTACTS
  ↓
RESPONSE


Animate the flow using GSAP.

40. LOADING STATES

Every asynchronous operation must have a loading state.

Use:

Skeletons

Spinners

Progress indicators

Never leave the screen blank.

41. ERROR STATES

Handle:

Network error

Authentication error

Location denied

Server error

Invalid form

Upload failure

Database error

Show useful human-readable messages.

42. EMPTY STATES

Example:

No incident reports yet.

When you report an incident, it will appear here.


Use appropriate Phosphor icon.

43. TOAST NOTIFICATIONS

Use shadcn/ui toast/sonner-style notifications.

Examples:

Incident submitted successfully.
Emergency contact added.
Profile updated.
SOS activated.
SOS resolved.
Report status updated.


44. REAL-TIME ARCHITECTURE

Design the application so that real-time updates can be added.

Prefer:

WebSockets / Socket.IO

for:

SOS status

Admin monitoring

Notifications

If real-time infrastructure is unavailable during initial development, create a clean polling fallback without breaking the architecture.

45. DEVELOPMENT DATA

Create seed data.

Development admin:

Email: admin@phoenix-safety.com
Password: Admin@123


Development user:

Email: user@phoenix-safety.com
Password: User@123


Clearly mark these as DEVELOPMENT credentials.

Never use these credentials in production.

46. ENVIRONMENT VARIABLES

Create:

.env.example


Include placeholders for:

DATABASE_URL
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
CLIENT_URL
SERVER_URL
EMAIL_API_KEY
SMS_API_KEY


Never commit real secrets.

47. PROJECT STRUCTURE

Use:

phoenix/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── models/
│   │   ├── validators/
│   │   ├── config/
│   │   └── server.ts
│   └── package.json
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── uploads/
├── .env.example
├── README.md
└── package.json


48. CRITICAL DEVELOPMENT RULE

Do NOT build this as a static template.

Every important feature must be connected:

React UI
   ↓
API
   ↓
Backend
   ↓
MySQL


For example:

SOS button:

Click
 ↓
Confirmation
 ↓
GPS
 ↓
POST /api/sos
 ↓
Backend
 ↓
Database
 ↓
Notification
 ↓
User UI
 ↓
Admin dashboard


Incident:

Form
 ↓
Validation
 ↓
Upload
 ↓
API
 ↓
Database
 ↓
Notification
 ↓
Admin
 ↓
Status update
 ↓
User notification


49. DO NOT FAKE FUNCTIONALITY

Do NOT create:

Fake buttons

Fake statistics

Fake API responses

Static dashboard numbers

Fake map locations pretending to be live

Non-functional forms

Placeholder authentication

If an external service cannot be configured, create a clearly separated development/mock service and document how to replace it with the real service.

50. TESTING

Test:

Authentication

Register

Login

Logout

Invalid credentials

Protected routes

SOS

Activate

Cancel

Resolve

GPS permission

Database persistence

Admin monitoring

Incidents

Create

Upload evidence

View

Update

Delete where permitted

Admin status update

Admin

User management

Incident management

SOS monitoring

Analytics

UI

Test:

Desktop

Tablet

Mobile

Dark/light behavior if implemented

Loading states

Error states

Empty states

Accessibility

Reduced-motion preference

51. FINAL QUALITY STANDARD

The final application must feel like:

A real modern safety-tech startup product — not a basic college project.

Prioritize:

Functionality

Safety UX

Clean architecture

Security

Responsive design

Accessibility

Performance

Visual polish

Use Phosphor Icons + shadcn/ui + Motion + GSAP consistently and intelligently.

Do not sacrifice usability for visual effects.

52. DEVELOPMENT PROCESS

Build the application incrementally.

Phase 1

Project setup and design system.

Phase 2

Database and backend architecture.

Phase 3

Authentication.

Phase 4

Landing page.

Phase 5

User dashboard.

Phase 6

Emergency contacts.

Phase 7

SOS system.

Phase 8

Maps and GPS.

Phase 9

Incident reporting.

Phase 10

Notifications.

Phase 11

Admin dashboard.

Phase 12

Admin SOS monitoring.

Phase 13

Incident management.

Phase 14

Analytics.

Phase 15

Security and validation.

Phase 16

Responsive UI and accessibility.

Phase 17

Final testing and bug fixing.

After every phase:

Show what was created.

List modified files.

Run/test the application.

Fix errors.

Continue to the next phase.

Do not move forward while the current phase contains obvious runtime errors.

FINAL REQUIREMENT

Build PHOENIX as a complete end-to-end application.

The final architecture must be:

                    PHOENIX
                       │
        ┌──────────────┴──────────────┐
        │                             │
      USER                         ADMIN
        │                             │
   React + UI                    React + UI
        │                             │
        └──────────────┬──────────────┘
                       │
                  REST API
                       │
                 Node + Express
                       │
             ┌─────────┴─────────┐
             │                   │
          MySQL              Services
             │                   │
       User / SOS /       Notifications
       Incidents /        Maps / Location
       Contacts


Deliver:

Complete frontend

Complete backend

MySQL schema

Seed data

Authentication

Authorization

SOS system

GPS/location

Maps

Incident reporting

Evidence uploads

Emergency contacts

Notifications

Admin dashboard

Analytics

Responsive UI

Phosphor Icons

shadcn/ui

Motion

GSAP

Security

Accessibility

.env.example

README

Setup instructions

Testing instructions

The application must be dynamic, fully connected, responsive, secure, accessible, animated, visually polished, and runnable end-to-end.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/aca71b40-e427-498e-8c78-c1de58a844e1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
