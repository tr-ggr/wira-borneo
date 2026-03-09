# Testing Volunteer Home Location and Routing

This guide walks through testing the volunteer home and OSRM routing feature in the **mobile** app (Next.js).

## Prerequisites

1. **API** and **mobile** app running:
   - From repo root: `npm run api` (API on port 3333) and `npm run mobile` (mobile on e.g. 4200 or 3000).
2. **Database** migrated and seeded so you have users and optional help-request data.

## Frontend “routes” (tabs)

The app uses **client-side tabs**, not URL paths. The bottom nav is:

| Tab       | Screen         | Path (state) |
| --------- | -------------- | ------------ |
| Forecast  | Map            | `/`          |
| Warnings  | Warnings       | `/warnings`  |
| Party     | Family         | `/family`    |
| Assistant | LLM            | `/assistant` |
| Help      | Help dashboard | `/help`      |
| Profile   | Profile        | `/profile`   |

You must be **logged in** to open Help and Profile.

---

## 1. Test “Set Home” and “own place”

**Goal:** Volunteer can set and see their home location.

1. **Log in**  
   Use a seeded user, e.g. `user1@example.com` / `Password123!`.

2. **Apply as volunteer** (creates a volunteer profile)
   - Open the **Help** tab.
   - Switch to the **Volunteer** sub-tab.
   - Click **“Apply as Volunteer”**.
   - After applying, the card will show “Application Pending” (unless an admin has already approved you).

3. **Open Profile and set home**
   - Open the **Profile** tab.
   - You should see a **“Volunteer Home”** card (only after you have applied as volunteer).
   - Click **“Set Home”** (or “Update Home Location”).
   - Allow location when the browser asks; the app will send your current GPS to the API.
   - You should see “Set at &lt;lat&gt;, &lt;lon&gt;” and the button change to “Update Home Location”.

4. **See home on the map**
   - Open the **Forecast** tab (map).
   - If you set home, a **teal house icon** should appear at that location on the map.

---

## 2. Test road route and ETA

**Goal:** Map shows a road route (OSRM) with ETA and the “Route from Current/Home” toggle works.

To get a **route to a destination**, the app needs a **focused** help request. That happens when you click **“Navigate”** on one of **your assigned** (claimed) help requests. So you need: an approved volunteer, at least one help request, and that request claimed by you.

**Option A – Two users (no admin app)**

1. **User A – create a help request**
   - Log in as e.g. `user1@example.com`.
   - Help → **Request** tab → create a request (e.g. “Request Help NOW” or the + button and submit with location).

2. **User B – volunteer and claim**
   - Log out; log in as e.g. `user2@example.com`.
   - Help → Volunteer → **Apply as Volunteer**.
   - Use the **admin** app (or API) to approve `user2@example.com`’s volunteer application.
   - Help → Volunteer → **Available** → find the request from User A → **Claim Request**.
   - Help → Volunteer → **My Assignments** → on the claimed request, click **“Navigate”**.

3. **Map and route**
   - You are taken to the **Forecast** (map) tab with that request as the destination.
   - You should see:
     - A **yellow road route** (OSRM) from your current location to the pin (or from home if you chose “Home”).
     - A card at the top: “Navigating to Help Pin”, “Route from current location” (or “from home”), and **ETA ~X min · Y km**.
   - If you have set **home** (as User B), a **“Current” / “Home”** toggle appears below the card.
     - Switch to **“Home”**: the route should recompute from your home location and the map should fit the new route.

**Option B – One user + admin app to approve**

1. Create a help request (same user or another).
2. Same user: Help → Volunteer → Apply as Volunteer.
3. In the **admin** app, log in as admin and **approve** that user’s volunteer application.
4. In the **mobile** app: Help → Volunteer → Available → **Claim** the request.
5. Help → Volunteer → **My Assignments** → **Navigate** on the assignment.
6. On the map, confirm road route, ETA, and (if home is set) the Current/Home toggle and map fit.

---

## 3. Quick checklist

| What to check                                             | Where                                            |
| --------------------------------------------------------- | ------------------------------------------------ |
| “Set Home” / “Update Home Location” and coordinates shown | Profile tab (after applying as volunteer)        |
| Home icon (teal house) on map                             | Forecast tab                                     |
| Road route (curved line) and destination pin              | Forecast tab after “Navigate” from an assignment |
| ETA and distance in the top card                          | Same as above                                    |
| “Route from current location” / “from home” text          | Same card                                        |
| “Current” / “Home” toggle (only if home is set)           | Below the card when navigating                   |
| Map fits the route                                        | After loading route or switching Current/Home    |

---

## 4. Troubleshooting

- **No “Volunteer Home” on Profile**  
  You must **Apply as Volunteer** first (Help → Volunteer). The card appears as soon as a volunteer profile exists (approval not required for setting home).

- **No “Navigate”**  
  “Navigate” appears only on **My Assignments** (claimed requests). Claim a request from **Available** first; volunteers must be **approved** to claim.

- **Route stays straight line or no ETA**  
  The app calls the wira-borneo API `/api/routing/route`, which proxies OSRM. Ensure the **API** is running and reachable from the app (correct `NEXT_PUBLIC_*` or API base URL). If OSRM fails, the map falls back to a straight line.

- **Admin approval**  
  From repo root: `npm run admin` to run the admin app, then use the seeded admin (e.g. `admin@wira-borneo.com`) to approve volunteer applications.
