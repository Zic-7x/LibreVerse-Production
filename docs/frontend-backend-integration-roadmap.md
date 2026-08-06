# Frontend & Backend Integrated Development Roadmap

This document outlines the step-by-step master plan to integrate the backend API contracts (**M1–M14**) with the live frontend app (**Mobile Preview** in `backend/src/presentation/http/views/mobile-preview.ts` and the Expo/React Native app shell in `mobile/` backed by `@platform/mobile`).

---

## 📊 High-Level Integration Matrix

| Step | Scope & Domain | Backend API Contracts | Live Mobile Preview Status |
| :--- | :--- | :--- | :--- |
| **Step 1** | Auth, E.164 Phone & Session Management | `M1`: `/auth/*`, `/auth/refresh` | **Completed ✅** (E.164 strict validation, OTP flow, hidden navbar when logged out, session restore) |
| **Step 2** | Profile, `@alias` & Media Avatars | `M2`: `/profiles/me`, `M3`: `/media/*` | **Completed ✅** (Dynamic avatar chooser, `@alias` display, `/profiles/me` sync) |
| **Step 3** | Friends & Social Graph | `M4`: `/friendships/*` | **Completed ✅** (Friend discovery, requests, response actions, unfriend, blocking, profile counters) |
| **Step 4** | Direct Messaging & WebSockets | `M5`: `/messages/*`, `M6`: `/ws`, `M7`: Rich Media | **Completed ✅** (Direct conversation list, 1:1 chat thread, messaging endpoints, edit/delete actions, auto-polling updates) |
| **Step 5** | Communities & Channels | `M9`: `/communities/*`, `M10`: Channel APIs | **Completed ✅** (Community discovery, create public communities, join/leave, multi-channel threads, member lists & roles) |
| **Step 6** | Stories & Visual Feed | `M11`: `/stories/*` | **Completed ✅** (Horizontal friend story rings, 24h story creation, full-screen viewer with progress timer & viewer tracking) |
| **Step 7** | Notifications, Safety & Reports | `M8`: `/notifications/*`, `M13`: `/reports/*`, `M14` | **Completed ✅** (Notification inbox, unread badge counters, notification settings toggles, report user/community sheet & status logs) |
| **Step 8** | Native Expo App Packaging & Polish | `FM15–FM18`: Expo UI & E2E QA | **Completed ✅** (Sync `@platform/mobile` client architecture, Vitest unit test suite, SecureStore token persistence, push deep-linking & theme tokens) |

---

## 🚀 Execution Steps Breakdown

### Step 1: Authentication, E.164 Validation & Session Persistence (FM0 – FM1)
* **Goal**: Deliver a secure, seamless login/registration experience with phone and email validation, OTP verification, persistent tokens, and dynamic navbar state.
* **Backend Contracts**: `POST /auth/register`, `POST /auth/login`, `POST /auth/verify-otp`, `POST /auth/refresh`, `POST /auth/logout`.
* **Frontend Implementation Tasks**:
  - [x] Validate phone numbers strictly in E.164 format (`+15551234567`, `+923001234567`) in backend and frontend preview.
  - [x] Integrate OTP modal generation and verify against `/auth/verify-otp`.
  - [x] Hide bottom navigation bar when logged out; reveal bottom navbar dynamically upon login.
  - [x] Implement session restoration on app initialization reading Bearer tokens from `localStorage` / SecureStore.
  - [x] Auto-refresh access token on 401 response interceptor.

---

### Step 2: Profile Customization & Media Uploads (FM2 – FM3)
* **Goal**: Allow users to edit their display name, bio, claim primary `@alias`, and select or upload custom media across all platform features (Reels, Stories, Avatars, Posts, Chat DMs).
* **Backend Contracts**: `GET /profiles/me`, `PATCH /profiles/me`, `POST /media/upload/init`, `POST /media/:id/complete`.
* **Frontend Implementation Tasks**:
  - [x] Profile edit modal with Display Name, Bio, and Avatar selector.
  - [x] Dynamic avatar fallbacks (Dicebear Identicon based on email, avatar gallery selection).
  - [x] Sync profile photo across top header, profile screen, and bottom navigation bar (`#nav-profile-img`).
  - [x] Custom device file uploads & drag-and-drop file inputs across all 5 core app features:
    - [x] **Profile Picture**: Device image upload & drag-drop via `POST /media/upload/init` (bucket: `platform-avatars`).
    - [x] **Reels**: Custom video & photo file picker / dropzone via `POST /media/upload/init` (bucket: `platform-reels`).
    - [x] **Stories**: 24h ephemeral story photo/video file upload via `POST /media/upload/init` (bucket: `platform-stories`).
    - [x] **Feed Posts**: Feed photo & video upload dropzone via `POST /media/upload/init` (bucket: `platform-media`).
    - [x] **Direct Messages / Chat**: Image & attachment button with file picker, backend upload, and inline media bubble rendering (bucket: `platform-attachments`).
  - [x] Public profile viewer via `@alias` deep link or search.

---

### Step 3: Friends & Social Graph (FM4)
* **Goal**: Enable social connections including friend discovery, request management, and user blocking.
* **Backend Contracts**: `GET /friends`, `POST /friends/requests`, `POST /friends/requests/:id/respond`, `POST /blocks`, `DELETE /blocks/:targetUserId`.
* **Frontend Implementation Tasks**:
  - [x] Add social graph sub-views under Explore (`People`, `Friends`, `Requests`, `Blocked`).
  - [x] Implement user search by `@alias` or display name in Explore view.
  - [x] Add "Add Friend" and "Accept / Decline" action buttons wired to backend endpoints.
  - [x] Implement block / unblock actions with confirmation modals.
  - [x] Direct "Send Message" action on friend cards opening 1:1 chat thread.
  - [x] Live Friends & Pending Requests counters on Profile screen.

---

### Step 4: Direct Messaging & Real-Time WebSockets (FM5 – FM7)
* **Goal**: Build a fast 1:1 direct messaging system with pagination, read receipts, WebSocket live updates, and rich media attachments.
* **Backend Contracts**: `POST /conversations/direct`, `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`, `PATCH /messages/:id`, `DELETE /messages/:id`, `POST /conversations/:id/read`.
* **Frontend Implementation Tasks**:
  - [x] Direct conversation list fetched from `GET /conversations` with unread indicators and timestamps.
  - [x] Chat thread screen with sender/receiver message bubbles, timestamps, and read receipts.
  - [x] Auto-polling live update loop (2.5s) for new incoming messages during active chat.
  - [x] Start 1:1 conversation from friend cards or Direct Messages search screen (`POST /conversations/direct`).
  - [x] Message editing (`PATCH /messages/:id`) and soft deletion (`DELETE /messages/:id`).
  - [x] Rich message attachments (image URL attachments).

---

### Step 5: Communities & Channel Messaging (FM9 – FM10)
* **Goal**: Provide group spaces (communities) with multi-channel text channels (e.g. `#general`, `#announcements`).
* **Backend Contracts**: `GET /communities`, `GET /communities/mine`, `POST /communities`, `GET /communities/:id`, `POST /communities/:id/join`, `POST /communities/:id/leave`, `GET /communities/:id/channels`, `POST /communities/:id/channels`, `GET /communities/:id/members`.
* **Frontend Implementation Tasks**:
  - [x] Communities discovery sub-tab under Explore with Public & Joined community filters.
  - [x] Create community flow with custom name, slug, description, and visibility settings.
  - [x] Community view header displaying member counts, cover avatar, bio, and join/leave toggles.
  - [x] Multi-channel thread drawer (`#general`, `#announcements`, `#lounge`) with channel creation for community admins.
  - [x] Channel messaging threads powered by `/conversations/:id/messages` with live 2.5s polling loop.
  - [x] Community members list with role badges (Owner, Admin, Member).

---

### Step 6: Stories & Interactive Media (FM11)
* **Goal**: Share 24-hour media stories with interactive full-screen viewer and view tracking.
* **Backend Contracts**: `GET /stories/feed`, `POST /stories`, `POST /stories/:id/view`, `GET /stories/:id/viewers`.
* **Frontend Implementation Tasks**:
  - [x] Horizontal story rings bar at the top of the Feed screen.
  - [x] Unviewed gradient story ring indicators (Instagram style).
  - [x] Multi-item full-screen story viewer with progress bar timers, tap-to-advance (left/right navigation), and close to dismiss.
  - [x] Camera / image preset modal to capture and post new 24h stories with captions and media upload sync (`POST /stories`).
  - [x] Call `/stories/:id/view` backend endpoint when viewing stories.
  - [x] Author story viewers modal (`GET /stories/:id/viewers`) displaying viewer profiles and counts.

---

### Step 7: Notifications, Safety & Reports (FM8, FM13 – FM14)
* **Goal**: Keep users informed via an in-app notification inbox while enforcing trust, safety, and reporting.
* **Backend Contracts**: `GET /notifications`, `POST /notifications/mark-read`, `GET /notification-preferences`, `PUT /notification-preferences`, `POST /reports`, `GET /reports`.
* **Frontend Implementation Tasks**:
  - [x] Activity & Safety screen with unread notification badge counters.
  - [x] All vs Unread notification filters with mark single/all as read (`POST /notifications/mark-read`).
  - [x] Notification preferences tab with real-time toggle switches (`GET /notification-preferences`, `PUT /notification-preferences`).
  - [x] Content & Safety report sheet modal (`POST /reports`) triggered from community headers, user profiles, or posts.
  - [x] Report history tab ("My Reports") showing submitted reports (`GET /reports`) and review statuses (`pending`, `reviewed`, `actioned`).

---

### Step 8: Native Expo Client Packaging & E2E Verification (FM15 – FM18)
* **Goal**: Sync the `@platform/mobile` domain use cases with the React Native Expo app shell (`mobile/`), ensure dark/light theme polish, accessibility, and E2E QA.
* **Backend & Mobile Contracts**: `@platform/mobile`, Expo SDK, iOS/Android builds.
* **Frontend Implementation Tasks**:
  - [x] Synchronize clean architecture use cases between `backend/src/presentation/http/views/mobile-preview.ts` and `@platform/mobile`.
  - [x] Platform native adapters for secure storage (`SecureTokenStorageAdapter` for iOS Keychain / Android Keystore) and Push Notifications (`PushNotificationHandler`).
  - [x] Accessibility labels and dynamic dark/light theme design tokens (`ThemeTokens`).
  - [x] Comprehensive Vitest E2E unit & architecture test suite covering critical user journeys (Auth -> Friends -> Chat -> Communities -> Stories -> Push).
  - [x] Production build setup with Expo package configuration (`mobile/package.json`).

---

---

## 🌟 Completed Advanced Features & Platform Enhancements

All requested advanced features have been fully integrated into the live applet:

1. **Native WebRTC Voice & Video Calling ✅**:
   - Transformed header phone & camera icons in DM threads into active WebRTC peer-to-peer calling sessions with live audio/video streams, mic toggle, camera flip, call duration timer, and P2P connection status.
2. **Rich Message Reactions & Typing Indicators ✅**:
   - Interactive emoji reactions (❤️, 👍, 😂, 🔥) on chat bubbles with reaction badges and counts.
   - Real-time `USER_TYPING` status indicator with animated bouncing dots in active chat threads.
3. **Push Notifications & Device Token Registration ✅**:
   - Device token registration endpoint `POST /user-devices` auto-triggered on app start.
   - Lock-screen push notification toast simulator at the top of the mobile device screen with one-click deep-linking.
4. **Reels Audio Remixing & Music Catalog ✅**:
   - Interactive Reels audio track badge opening the Audio Catalog modal with waveform preview, total Reels count using the sound, and a **"🎬 Use This Audio in New Reel"** button.
4. **AI-Powered Content Moderation & Auto-Captions**:
   - Integrate Gemini API auto-tagging for uploaded Reels and Posts to generate captions, content safety labels, and accessibility alt text automatically during `/media/:id/complete`.
