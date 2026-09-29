# SMILO

**Your smile is private. Your thoughts are yours to share.**

A frontend MVP for a positive social platform, built for a hackathon demo with vanilla HTML, CSS and JavaScript.

---

## Problem

Most social platforms make people expose themselves to be seen. Positivity gets confused with performance — you have to post to prove you feel good. That pushes people either to overshare or to opt out of positive-habit platforms altogether.

## Solution

SMILO separates two layers of the experience:

- **Private emotional layer** — a smile is verified privately. It contributes to a personal smile count, points, streak and achievements. It is never posted, stored, or shown to anyone else.
- **Public social layer** — thoughts are shared deliberately, with a visibility the user chooses every time (Global, Friends, or Only Me).

The core loop:

```
PRIVATE SMILE → VERIFY → EARN POINTS → BUILD STREAK
→ SHARE THOUGHT → CONNECT → CONTRIBUTE TO COMMUNITY → COLLECTIVE GOAL
```

## Key Features

- **Private Smile Verification** — upload or "take" a photo; a simulated check detects a smile, awards points and updates your streak, then the image is discarded. Nothing is uploaded or stored.
- **SMILO reactions** — Made Me Smile, Inspired Me, Relatable, Worth Sharing (no generic "Like").
- **Global Smile Pulse** — an animated, aggregate-only counter of community smiles, active users, thoughts shared and active streaks.
- **Smile Missions & streaks** — daily and weekly missions; streaks depend on real activity (a verified smile, a shared thought, a completed mission), not just opening the app.
- **Collective Community Goals** — a shared smile target the whole community contributes to, with a completion celebration.
- **SMILO Assist** — a private, in-app chat companion for expressing a hard day, shaping a thought, or getting a mission suggestion. Never posts on your behalf.
- **Discover, Friends, Chat, Leaderboard, Dashboard, Thought history, Settings** — full social graph, messaging, transparent ranking, impact breakdown and privacy controls.
- **Light / Black themes** — a genuine dark theme (not a CSS invert), persisted with `localStorage` and consistent across every page.

## Unique Differentiator

Nearly every social app treats "positivity" as a public performance. SMILO makes the emotional signal (the smile) private by design, and only ever surfaces it as an aggregate or a personal stat — never as content. What's public is entirely the user's choice: their words, not their face.

## Privacy Model

- A smile photo is never uploaded, stored, or transmitted anywhere in this build — verification happens (in simulation) entirely client-side, and the image reference is discarded the moment the check completes.
- No smile image ever appears in a feed, on a profile, in Discover, or anywhere else.
- Thought visibility (Global / Friends / Only Me) is set per-post by the user and can be changed at any time.
- **This is a frontend prototype.** `localStorage`-based "authentication" and "privacy" are for demo purposes only and provide no real security or confidentiality — see *Known Frontend-Only Limitations* below.

## Tech Stack

- HTML5, CSS3 (custom properties / design tokens, no framework), vanilla JavaScript (ES6+)
- [Font Awesome](https://fontawesome.com) for iconography
- `localStorage` for demo persistence — no backend, no build step
- [DiceBear](https://dicebear.com) for generated demo avatars (requires network access; falls back gracefully if offline, avatars simply won't load)

## Project Structure

```
smilo/
├── index.html          Landing / entry page
├── login.html
├── signup.html
├── onboarding.html
├── home.html            Main feed (3-column app shell)
├── dashboard.html        Stats, Impact, Missions, Achievements
├── friends.html
├── discover.html          Discover / Friends / Requests / Sent tabs
├── leaderboard.html
├── thoughts.html          "My Thoughts" history
├── chat.html               Conversations + SMILO Assist
├── settings.html
│
├── css/
│   ├── variables.css     Design tokens (light + black theme)
│   ├── base.css          Reset, typography, toasts, skeletons
│   ├── components.css    Buttons, cards, forms, modals, tabs…
│   ├── layout.css        Navbar, sidebars, app shell, drawer
│   ├── auth.css           Login/signup/onboarding
│   ├── home.css            Pulse card, composer, feed, post cards
│   ├── dashboard.css        Stats/impact/achievements/discover/leaderboard/settings
│   ├── chat.css              Chat-specific layout
│   └── responsive.css         Breakpoints
│
├── js/
│   ├── storage.js     Data model, localStorage CRUD, demo seed data
│   ├── theme.js        Light/black theme manager
│   ├── ui.js            Toasts, modals, dropdowns, drawer, tabs
│   ├── auth.js            Login, signup, session, route protection
│   ├── app.js              Shared navbar + left sidebar rendering
│   ├── smile.js             Private smile verification flow
│   ├── missions.js            Daily mission rollover
│   ├── notifications.js        Derived notification helpers
│   ├── home.js                   Feed, composer, reactions, right sidebar
│   ├── dashboard.js                Stats, impact, missions, achievements
│   ├── discover.js                   Discover/Friends/Requests/Sent
│   ├── friends.js                      My Friends
│   ├── leaderboard.js                   Leaderboard
│   ├── thoughts.js                       My Thoughts history
│   ├── chat.js                             Conversations + SMILO Assist
│   └── settings.js                          Profile/privacy/appearance/feed
│
└── README.md
```

## How to Run

No build step. Serve the folder with any static file server and open `index.html`:

```bash
cd smilo
python3 -m http.server 8080
# then open http://localhost:8080
```

(Opening `index.html` directly via `file://` also works, though a local server avoids any browser file-access quirks.)

## Demo Credentials

Use **"Continue with demo account"** on the login screen, or log in manually:

- Email: `alexmorgan@smilo.demo`
- Password: `demo1234`

Or create a brand new account through Sign Up — it flows straight into onboarding.

## Future Backend Architecture

This build is intentionally structured so a real backend can slot in behind the same interfaces (`Users`, `Thoughts`, `Friends`, `Chats`, `Missions`, `CommunityGoal`, `GlobalStats` in `storage.js`):

- **Auth** — real hashed passwords (bcrypt/argon2), server-issued sessions or JWTs, email verification, rate-limited login.
- **Smile verification** — on-device ML (e.g. a lightweight face-landmark/smile-classifier model run in-browser or on a mobile SDK) so the image never has to leave the device at all, or a server-side model behind an encrypted, ephemeral upload that is deleted immediately after inference.
- **Data** — a real database (Postgres) replacing `localStorage`, with row-level authorization so a user can only edit/delete their own records.
- **API** — REST or GraphQL endpoints mirroring the `storage.js` functions, with server-side input validation and rate limiting.
- **Chat** — WebSocket-based real-time delivery instead of simulated replies.
- **Notifications** — push/WebSocket-based instead of derived-on-render.

## Hackathon Demo Flow

1. Land on `index.html` → **Create Account**
2. Complete Signup → Onboarding (interests, privacy explainer)
3. Arrive at Home → see the **Global Smile Pulse**
4. **Verify a private smile** → points, streak, "stays private" confirmation
5. Post a thought → see a reaction come in → switch **Global → Friends**
6. Open **Discover** → send a friend request
7. Open **Chat** → talk to **SMILO Assist**
8. Complete a mission on **Dashboard**
9. Check **Leaderboard** and the **Community Goal**
10. Toggle **Light → Black** theme

## Future Improvements

- Real on-device smile detection (e.g. TensorFlow.js face landmarks)
- Comments on thoughts (composer exists; comment threads are a stub in this build)
- Push notifications and a persisted notification log
- Image attachments in chat
- Server-authoritative leaderboard and anti-abuse checks

## Known Frontend-Only Limitations

- **No real authentication.** Passwords are stored in plain `localStorage` for demo purposes only — never do this in production.
- **No real smile detection.** The verification "AI" is a randomized simulation (~88% success) purely to demonstrate the product flow.
- **No real backend/database.** All data lives in the browser's `localStorage` and is local to one browser/device — it is not shared between users or devices, and demo "friends" replying in Chat are simulated, not live people.
- **No real privacy enforcement.** Visibility settings are honored by the UI logic, not by any server-side access control.
