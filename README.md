# AgriPen Connect

# AGRIPEN TEAM-APP — PRODUCTION-READY PWA

Build a complete, production-ready Progressive Web App called:

**agripen team-app**

This is NOT a simple dashboard.

This is a complete internal collaboration, communication, knowledge-sharing, media, file, and project-activity platform for the AgriPen team.

The application should feel like a premium combination of:

* Slack
* Discord
* Notion
* Google Drive
* Modern social activity feeds
* Team communication platforms

But it must have its own unique **AgriPen identity**.

The most important requirement is to build a **very clean, scalable, maintainable, professional architecture** from the beginning.

Do not create a messy prototype.

Do not duplicate components unnecessarily.

Do not create unnecessary files.

Do not put everything inside one giant component.

Use reusable components, clear separation of concerns, proper naming, reusable hooks, reusable services, and a logical folder structure.

---

# 1. IMPORTANT — USE THE PROVIDED IMAGES

I have attached reference images/inspiration for the application.

Use the attached images as **visual design references and inspiration**.

Analyze:

* Layout
* Spacing
* Navigation
* Cards
* Feed structure
* Chat layout
* Typography
* Glass effects
* Mobile navigation
* Desktop navigation
* Visual hierarchy
* Interaction patterns

Do NOT blindly copy the designs.

Use them as inspiration and create a coherent original AgriPen interface.

---

# 2. AGRIPEN LOGO

Import the provided AgriPen logo images/assets.

IMPORTANT:

The logo must be imported as real image files and stored inside:

**public/**

Do NOT store the logo as JSON.

Do NOT convert the logo into a JSON object.

Do NOT embed the logo as a huge inline SVG if the provided image asset is available.

Create a clean public asset structure such as:

public/
assets/
branding/
agripen-logo.*
agripen-logo-light.*
agripen-logo-dark.*
agripen-icon.*

Use the correct logo throughout:

* Login
* Signup
* Sidebar
* Header
* PWA icon
* Browser favicon
* Loading screen
* Empty states where appropriate

If the provided logo has multiple variants, use the correct variant depending on the background.

---

# 3. BRAND IDENTITY

The entire application must use the colors of the AgriPen logo.

Do NOT invent an unrelated color palette.

Extract the visual identity from the provided AgriPen logo and create a consistent design system.

Use the logo colors for:

* Primary actions
* Buttons
* Active navigation
* Links
* Accents
* Notifications
* Highlights
* Focus states
* Charts
* Status indicators

The design should be:

* Premium
* Modern
* Futuristic
* Clean
* Professional
* Minimal
* Agricultural technology
* Startup-quality
* Elegant
* Highly polished

Use subtle glassmorphism.

Avoid:

* Excessive gradients
* Excessive shadows
* Excessive rounded cards
* Visual clutter
* Generic admin-dashboard styling
* Cheap-looking UI
* Overly colorful interfaces

---

# 4. APPLICATION NAME

The application name MUST be exactly:

**agripen team-app**

This exact name must be used for:

* PWA name
* Manifest name
* Manifest short_name where appropriate
* Browser document title where appropriate
* Application metadata

Do NOT use:

* AgriPen Team
* AgriPen Workspace
* AgriPen Dashboard
* AgriPen OS
* Lovable

The visible application name should be:

**agripen team-app**

---

# 5. PWA

This must be a REAL Progressive Web App.

Implement:

* Web App Manifest
* Service Worker
* Installable PWA
* Standalone display mode
* Proper icons
* Proper favicon
* Splash/loading experience
* Offline caching
* Cache strategies
* Network detection
* Offline indicator
* Background synchronization where appropriate

The PWA must work correctly on:

* Android
* iPhone/iOS
* Tablets
* Windows
* macOS
* Linux
* Modern desktop browsers

The application must be installable.

---

# 6. OFFLINE-FIRST EXPERIENCE

Offline support is a CORE REQUIREMENT.

Do not implement fake offline functionality.

When the user loses internet access, the application must continue working with locally available/cached data.

Users should be able to:

* Open previously loaded conversations
* Read cached posts
* Read cached messages
* Browse cached files metadata
* Write messages
* Create posts
* Add notes
* Queue actions
* Prepare uploads
* Continue working

When internet connection returns:

Automatically synchronize pending actions.

Implement safe synchronization behavior:

* Pending
* Syncing
* Synced
* Failed

Prevent:

* Duplicate messages
* Duplicate posts
* Lost messages
* Lost drafts
* Duplicate uploads
* Corrupted state

Use a robust local persistence strategy suitable for a PWA.

Prefer IndexedDB/local persistent storage for structured offline data rather than relying only on localStorage.

---

# 7. RESPONSIVE DESIGN

The application must be completely responsive.

It must work beautifully on:

### Phones

* Small Android phones
* Large Android phones
* iPhones
* Small screens
* Large screens
* Portrait
* Landscape

### Tablets

* Small tablets
* Large tablets
* iPad
* Android tablets
* Portrait
* Landscape

### Computers

* Small laptops
* Large laptops
* Desktop monitors
* Ultrawide monitors

Do NOT simply scale the desktop UI down.

Create proper responsive layouts.

For mobile:

* Mobile navigation
* Bottom navigation where appropriate
* Collapsible sidebar
* Touch-friendly controls
* Mobile chat interface
* Mobile-friendly media viewer
* Mobile-friendly composer
* Mobile-friendly notifications

For desktop:

* Sidebar
* Main content area
* Optional contextual right panel
* Full chat experience
* Larger media previews

Ensure:

* No horizontal overflow
* No broken layouts
* No clipped text
* No inaccessible buttons
* Proper touch targets
* Proper spacing
* Safe-area support for modern phones

---

# 8. MAIN CONCEPT

The application is a central workspace for EVERYTHING happening inside AgriPen.

Team members should be able to share:

* Text
* Images
* Videos
* Voice messages
* Audio
* Files
* PDFs
* Documents
* Links
* Emails
* Research
* Prototype updates
* Hardware tests
* Software updates
* AI updates
* Agronomy information
* Partnership updates
* Meeting information
* Announcements
* Notes

Everything should become part of the project's searchable history.

---

# 9. MAIN FEED

Create a central activity feed.

This is NOT a dashboard.

The feed should feel like a modern internal social workspace.

Examples:

A team member uploads photos:

"Achraf uploaded 4 images"

A team member creates a hardware update:

"HW-080 soil sensor test completed"

An email is added:

"New partnership email added"

A file is uploaded:

"AgriPen MVP02 test report uploaded"

A video is shared:

"New prototype test video"

A voice message is posted.

A team member publishes a text update.

Every activity should show:

* User
* Avatar
* Timestamp
* Content
* Attachments
* Reactions
* Comments
* Replies where appropriate

Use elegant glassmorphism cards.

---

# 10. TODAY / RECENT ACTIVITY

Create a section that clearly shows what happened recently.

For example:

TODAY

09:12 — New hardware update
10:03 — 4 images uploaded
10:27 — Sensor test created
11:41 — Partnership email added
13:15 — PDF uploaded
14:02 — New discussion
15:40 — Prototype video uploaded

The purpose is to let any team member immediately understand:

"What happened in AgriPen recently?"

---

# 11. GROUPS / CHANNELS

Implement team groups/channels.

Examples:

* General
* Hardware
* Software
* AI
* Agronomy
* Experiments
* Partnerships
* Emails
* Product
* Research
* Announcements

Each group should have:

* Name
* Description
* Icon
* Members
* Messages
* Posts
* Files
* Media
* Search
* Pinned content

The admin can create, rename, archive, and manage groups.

---

# 12. DIRECT MESSAGES

Implement private 1-to-1 messaging between team members.

Features:

* Text
* Images
* Videos
* Files
* Voice messages
* Emoji
* Reactions
* Replies
* Message timestamps
* Read state
* Typing indicator where appropriate
* Online/offline presence where appropriate

Messages should work with realtime synchronization.

---

# 13. REALTIME

Use Supabase Realtime where appropriate.

Realtime features should include:

* New messages
* New posts
* Reactions
* Comments
* Presence
* Typing indicators where appropriate
* Notifications
* Group activity

Avoid unnecessary realtime subscriptions.

Clean up subscriptions correctly.

Prevent memory leaks.

---

# 14. VOICE MESSAGES

Implement voice message recording.

Users should be able to:

* Record
* Cancel
* Preview
* Send
* Play
* Pause
* See duration

Store audio securely.

Provide a beautiful audio player.

Handle mobile permissions correctly.

---

# 15. MEDIA

Users can upload:

* Images
* Videos
* Audio
* PDFs
* Documents
* Other project files

Implement:

* Upload progress
* Preview
* File size validation
* Type validation
* Error handling
* Retry
* Secure storage
* Offline queue where appropriate

Images should have optimized previews.

Videos should not unnecessarily load full-size files in feed previews.

---

# 16. FILE MANAGEMENT

Create a dedicated Files section.

Organize files logically.

Example:

AgriPen Files

Hardware

* ESP32
* Sensors
* Schematics
* PCB
* Prototype

Software

* PWA
* Backend
* Documentation

Research

* Papers
* Agronomy
* AI

Business

* Pitch Deck
* Business Plan
* Partnerships

Allow:

* Upload
* Download
* Preview where possible
* Search
* Rename
* Move
* Delete
* Share internally
* Organize

---

# 17. EMAIL SHARING

Team members must be able to add important emails to the workspace.

An email item should support:

* Sender
* Subject
* Date
* Content
* Attachments
* Tags
* Comments
* Related group/project

Example:

Bioenterprise Canada
Introduction Call

The team should be able to discuss the email internally.

---

# 18. LINKS / RESOURCES

Create a resource system for:

* Websites
* Research papers
* YouTube videos
* GitHub repositories
* Documentation
* Articles
* Tools

Every resource can contain:

* Title
* URL
* Description
* Author
* Added by
* Date
* Tags
* Comments

---

# 19. EXPERIMENTS

Create a dedicated Experiments section.

An experiment should support:

* Title
* Description
* Date
* Team member
* Environment
* Soil type
* Sensor configuration
* Measurements
* Photos
* Videos
* Files
* Notes
* Results
* Status

For example:

Experiment #12

Soil:
Clay

Sensors:
DHT22
HW-080

Measurements:
Temperature
Humidity
Soil moisture

Results:
PASS / FAIL / NEEDS REVIEW

This should become part of AgriPen's long-term project memory.

---

# 20. NOTIFICATIONS

Implement a professional notification system.

Notifications should support:

* New message
* Mention
* Reply
* Reaction
* New group activity
* New file
* New post
* New announcement
* Important project activity

Create:

* Notification center
* Unread count
* Mark as read
* Mark all as read

Use browser/PWA push notifications where technically supported.

Ask permission appropriately.

Do not spam users.

---

# 21. SEARCH

Search must be powerful.

Search across:

* Messages
* Posts
* Users
* Groups
* Files
* Emails
* Experiments
* Resources

Example:

Searching:

**HW-080**

should be able to find related:

* Messages
* Posts
* Experiments
* Images
* Files
* Notes
* Sensor discussions

Create a clean global search experience.

---

# 22. USER ACCOUNTS

The application must have authentication.

IMPORTANT:

There must NOT be an open public registration page.

Users can only register through a special invitation/signup link generated/shared by the admin.

The registration flow must be based on an invitation link.

The old/default registration flow must be removed.

---

# 23. ADMIN ACCOUNT

Create one initial administrator account.

Admin email:

**[achraf.dev.ai@gmail.com](mailto:achraf.dev.ai@gmail.com)**

Initial password:

**admin123**

The password will be changed later.

IMPORTANT SECURITY REQUIREMENT:

Do NOT expose this password in frontend code.

Do NOT hardcode it in React components.

Do NOT put it in public files.

Do NOT send it to the browser.

Use environment variables / secure server-side configuration.

For example, configure the initial admin credentials through environment variables.

The admin must have complete permissions.

Admin permissions include:

* Manage users
* Create users
* Disable users
* Delete users
* Change roles
* Create groups
* Delete groups
* Rename groups
* Manage permissions
* Moderate messages
* Moderate posts
* Delete content
* Manage files
* Manage announcements
* Manage invitations
* View system activity
* Manage notifications
* Manage workspace settings

The admin is the highest authority in the application.

---

# 24. INVITATION-BASED REGISTRATION

Only the admin can generate/share invitation links.

The workflow:

ADMIN
↓
Create invitation
↓
Generate secure unique invitation link
↓
Share link with team member
↓
Team member opens link
↓
Registration page opens
↓
User creates account
↓
Invitation becomes used/invalid
↓
User joins AgriPen Team-App

Implement secure invitation tokens.

Invitation links must:

* Be unique
* Be difficult to guess
* Have expiration support
* Be single-use
* Be invalid after successful registration
* Be revocable by admin

Do NOT allow random people to register without an invitation.

---

# 25. REQUIRED REGISTRATION INFORMATION

Every team member MUST provide:

* First name
* Last name
* Date of birth
* Specialization in the project
* Main job/role
* Real profile photo

Do not allow registration completion without these required fields.

Example:

First Name:
Achraf

Last Name:
Mehloul

Date of Birth:
DD/MM/YYYY

Project Specialization:
Software / Hardware / AI / Agronomy / etc.

Main Job:
Developer / Engineer / Researcher / etc.

Profile Photo:
Required

---

# 26. PROFILE

Each user has a professional profile.

Display:

* Real profile photo
* Full name
* Project specialization
* Main job
* Joined date
* Groups
* Activity
* Status

Do not expose unnecessary personal information publicly.

Date of birth should be treated as private account information unless explicitly needed.

---

# 27. ROLES

Implement a clean role system.

At minimum:

ADMIN
TEAM MEMBER

Design the architecture so additional roles can be added later.

Do not scatter permission checks randomly throughout the frontend.

Centralize authorization logic.

Security must be enforced server-side/database-side, not only by hiding buttons in the UI.

---

# 28. DATABASE ARCHITECTURE

Create a very clean and scalable Supabase database architecture.

Use proper normalized tables.

Avoid putting unrelated data into one table.

Avoid duplicated information.

Create appropriate relationships, indexes, constraints, and timestamps.

Consider tables such as:

profiles
roles
groups
group_members
messages
message_attachments
posts
post_comments
post_reactions
files
file_metadata
notifications
invitations
resources
emails
experiments
experiment_measurements
user_activity
etc.

Only create tables that are actually needed.

Use UUIDs.

Use created_at / updated_at consistently.

Use proper foreign keys.

Use indexes for frequent searches.

---

# 29. SUPABASE SECURITY

Implement proper Row Level Security.

Users should only access data they are authorized to access.

Examples:

* Private messages are private
* Group messages are accessible only to group members
* Admin functionality is restricted
* Invitation management is admin-only
* User profiles expose only appropriate fields
* File access is controlled
* Storage policies are secure

Do not rely only on frontend authorization.

---

# 30. CLEAN CODE ARCHITECTURE

This is extremely important.

Build a very clean folder structure.

Do NOT put everything in one folder.

Do NOT create huge components.

Use reusable components.

Use clear naming.

Use separation of concerns.

A structure similar to:

src/
components/
features/
auth/
feed/
chat/
groups/
files/
notifications/
profiles/
experiments/
resources/
emails/
hooks/
services/
lib/
utils/
types/
pages/
layouts/
stores/

public/
assets/
branding/

Adapt the exact structure to the chosen technology stack, but keep the architecture clean and scalable.

---

# 31. COMPONENT QUALITY

Every component should have one clear responsibility.

Avoid:

* Giant components
* Duplicate UI
* Duplicate business logic
* Hardcoded data everywhere
* Hardcoded permissions
* Hardcoded user IDs
* Hardcoded colors throughout components
* Inline styles everywhere

Create reusable:

* Buttons
* Inputs
* Modals
* Cards
* Avatars
* File previews
* Media viewers
* Chat bubbles
* Notification items
* Feed items
* Loading states
* Error states
* Empty states

---

# 32. DESIGN SYSTEM

Create a centralized design system.

Define:

* Typography
* Spacing
* Radius
* Shadows
* Glass effects
* Colors
* Transitions
* Breakpoints
* Component states

Use CSS variables/theme tokens where appropriate.

Do not hardcode the same colors repeatedly throughout the application.

---

# 33. GLASSMORPHISM

The interface should use a sophisticated glass effect.

Use:

* Backdrop blur
* Transparent surfaces
* Subtle borders
* Soft depth
* Controlled transparency

But maintain readability.

Glass effects should not reduce accessibility.

Avoid making everything glass.

Use glass strategically for:

* Sidebar
* Header
* Feed cards
* Chat panels
* Modal surfaces
* Navigation
* Important UI containers

---

# 34. ANIMATIONS

Add subtle premium animations.

Examples:

* Page transitions
* Message appearance
* Notification arrival
* Modal opening
* Button interactions
* Hover effects
* Upload progress
* Loading states

Animations must be:

* Smooth
* Fast
* Professional
* Subtle

Respect reduced-motion preferences.

---

# 35. LOADING / ERROR / EMPTY STATES

Every major feature must have:

* Loading state
* Empty state
* Error state
* Retry state

Do not leave blank screens.

Examples:

"No messages yet."

"No files uploaded."

"No notifications."

"You're offline."

"Synchronization pending."

---

# 36. PERFORMANCE

Optimize the application seriously.

Implement:

* Lazy loading
* Code splitting where appropriate
* Image optimization
* Efficient queries
* Pagination
* Infinite scrolling where appropriate
* Virtualization where necessary
* Debounced search
* Proper caching
* Efficient realtime subscriptions

Do not load large videos or files unnecessarily.

Do not fetch the entire database for a feed.

---

# 37. ACCESSIBILITY

The application must be accessible.

Implement:

* Keyboard navigation
* Focus states
* Semantic HTML
* Proper labels
* Screen-reader friendly controls
* Sufficient contrast
* Touch-friendly controls
* Reduced motion support

---

# 38. SECURITY

Implement secure practices throughout.

Protect against:

* Unauthorized access
* XSS
* Unsafe file uploads
* Invalid file types
* Oversized files
* Unauthorized database access
* Invitation abuse
* Token guessing
* Permission escalation

Validate data server-side.

Never trust client-side input.

---

# 39. MOBILE EXPERIENCE

On mobile, prioritize:

1. Feed
2. Chat
3. Groups
4. Notifications
5. Profile

Use a clean bottom navigation or mobile navigation pattern.

The mobile experience must feel like a real native application.

Do not simply make the desktop sidebar smaller.

---

# 40. DESKTOP EXPERIENCE

On desktop, use:

Left:
Navigation/sidebar

Center:
Main content/feed/chat

Optional right:
Context/details/activity panel

Use available screen space intelligently.

---

# 41. ADMIN PANEL

Create a dedicated admin area.

Admin should be able to manage:

Users
Groups
Invitations
Content
Files
Announcements
Permissions
Workspace settings
System activity

The admin panel should use the same AgriPen visual identity.

---

# 42. INVITATION MANAGEMENT UI

Create a clean admin interface:

INVITATIONS

[ Create Invitation ]

List:

* Created by
* Created date
* Expiration
* Status
* Used by
* Copy link
* Revoke

Statuses:

ACTIVE
USED
EXPIRED
REVOKED

---

# 43. NO MOCK DATA IN PRODUCTION FLOW

Do not build the application around fake/static mock data.

Use real Supabase data.

If seed/demo data is necessary for development, isolate it clearly and make it removable.

The final application must use the actual backend.

---

# 44. ERROR HANDLING

Implement proper error handling.

Never silently fail.

Display useful user-friendly errors.

Log technical details appropriately without exposing sensitive information.

Provide retry actions where appropriate.

---

# 45. OFFLINE SYNC DETAILS

Create a robust offline queue.

For example:

Action:
CREATE_MESSAGE

Status:
PENDING

When connection returns:

PENDING
→ SYNCING
→ SYNCED

If failure:

PENDING
→ SYNCING
→ FAILED

Allow retry.

Ensure idempotency to avoid duplicate operations.

---

# 46. DATA CONSISTENCY

The application must preserve data integrity.

Avoid:

* Duplicate messages
* Duplicate notifications
* Duplicate uploads
* Duplicate invitations
* Broken relationships
* Lost drafts

Use unique identifiers and appropriate database constraints.

---

# 47. FINAL UI STRUCTURE

Create a polished application structure similar to:

AGRIPEN TEAM-APP

Sidebar:

🏠 Home
📰 Feed
💬 Messages
👥 Groups
📁 Files
🧪 Experiments
🔗 Resources
📧 Emails
🔔 Notifications
👤 Profile

Admin-only:

⚙ Admin

Main area:

Dynamic content depending on selected section.

---

# 48. HOME PAGE

The Home page should immediately communicate:

"What is happening in AgriPen?"

Show:

* Recent activity
* New posts
* Recent messages
* Important announcements
* Recent files
* Recent experiments
* Notifications
* Online team members

Do NOT turn it into a traditional analytics dashboard.

---

# 49. FEED COMPOSER

Create a beautiful composer:

"What's happening in AgriPen?"

Allow:

📝 Text
📷 Image
🎥 Video
🎙️ Voice
📁 File
🔗 Link
📧 Email
🧪 Experiment

The composer should be fast and intuitive.

---

# 50. GROUP EXPERIENCE

Each group should have:

Header:

Group name
Description
Members
Search

Tabs or sections:

Chat
Posts
Files
Media
Pinned

Keep navigation simple.

---

# 51. FINAL QUALITY REQUIREMENT

The application must feel like a real product that could be presented to:

* Investors
* Incubators
* Partners
* Engineers
* Customers

It must NOT feel like a generated template.

It must NOT feel like a generic CRUD application.

It must NOT feel like a basic admin dashboard.

It must feel like a premium internal technology platform built specifically for AgriPen.

---

# 52. IMPORTANT IMPLEMENTATION RULE

Before implementing each major feature:

Think about:

* Architecture
* Data model
* Security
* Responsive behavior
* Offline behavior
* Error handling
* Reusability
* Performance

Do not rush into creating UI components without considering the underlying architecture.

If an existing Supabase project/schema already exists, inspect it first and preserve compatible existing functionality rather than unnecessarily rebuilding or deleting working infrastructure.

Do not destroy existing working AgriPen functionality.

Make changes incrementally.

---

# 53. FINAL ACCEPTANCE CHECKLIST

Before considering the project complete, verify:

* [ ] PWA install works
* [ ] Offline mode works
* [ ] Offline indicator works
* [ ] Offline queued actions synchronize
* [ ] No duplicate sync operations
* [ ] Responsive on phones
* [ ] Responsive on tablets
* [ ] Responsive on desktop
* [ ] AgriPen logo imported into public/
* [ ] Logo is not stored as JSON
* [ ] Application name is exactly "agripen team-app"
* [ ] Browser title is correct
* [ ] Manifest is correct
* [ ] Favicon is correct
* [ ] Glassmorphism design implemented
* [ ] AgriPen logo colors used consistently
* [ ] Authentication works
* [ ] Registration requires invitation
* [ ] Invitation links are secure
* [ ] Invitation links are single-use
* [ ] Admin can manage invitations
* [ ] Admin account is configured through secure environment variables
* [ ] Admin has full permissions
* [ ] Required profile information is enforced
* [ ] Real profile photo is required
* [ ] Groups work
* [ ] Direct messages work
* [ ] Realtime messaging works
* [ ] Posts work
* [ ] Comments work
* [ ] Reactions work
* [ ] File uploads work
* [ ] Image uploads work
* [ ] Video uploads work
* [ ] Audio/voice messages work
* [ ] Notifications work
* [ ] Search works
* [ ] Experiments work
* [ ] Resources work
* [ ] Emails can be added
* [ ] Admin panel works
* [ ] RLS/security policies are implemented
* [ ] No unauthorized data access
* [ ] Loading states exist
* [ ] Error states exist
* [ ] Empty states exist
* [ ] No major console errors
* [ ] No broken routes
* [ ] No unnecessary duplicate components
* [ ] Clean folder structure
* [ ] Clean reusable architecture
* [ ] Production-quality UI

Do not stop at creating a visually attractive prototype.

Build the complete foundation and architecture so the application can scale as AgriPen grows.

The final result should be a **clean, secure, responsive, offline-first, realtime, installable PWA with a premium AgriPen glassmorphism interface and a highly maintainable architecture.**

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/67f7160c-44aa-482e-8698-db5586a9a84e).

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
