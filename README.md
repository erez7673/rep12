# Rep12

A free workout app (installable web app) for Android and iPhone: personal 12-week gym plans, timers and a machine guide.

**Open the app:** https://erez7673.github.io/rep12/

> Rep12 gives general fitness guidance, not medical advice. If you have an injury or a health condition, check with a doctor or physiotherapist before you start.

- App-built plans: 2 or 3 full-body days (2–3 sets of 10–15 reps), the AB Plan (4 days: chest, biceps and back / shoulders, triceps and legs) Upper / Lower (4 days) and a Seated plan with no standing or floor work (3 days), fully editable per day
- 12-week plans built from your stats, goal, schedule, injuries and focus areas: 4 exercises × 4 sets per day, plus warm-up, optional cardio finisher and cooldown
- Tap the sets on a day to change reps or kg before you start
- Pick the muscle areas of each workout day (e.g. Workout Day A: chest + biceps) and the app chooses the exercises
- Warm-up on a cardio machine you pick, for the minutes you set, with a beep when it's done
- "Add to workout" on any exercise page puts it into one of your workout days
- Set timer, automatic rest countdown with a beep at the end, screen kept awake during workouts
- 11 languages (English, Español, Português, Deutsch, Italiano, Suomi, Svenska, 中文, हिन्दी, العربية, עברית) and metric or US units (lb, ft) – Profile → gear → Settings
- Light / dark mode (button on My Plan, or Settings → Appearance; Auto follows the phone)
- A short app tour for new users (replay any time from Profile)
- Accessibility (person icon on Profile): bigger text, high contrast, bigger buttons, spoken workout cues; works with VoiceOver and TalkBack
- Automatic progression: weight goes up when you hit the top of the rep range on every set
- ~100 exercises with step-by-step instructions and a picture of the equipment, and video clips for most exercises
- Gym Setup (switch off what your gym doesn't have) + "What is this machine?" photo picker for unknown machines
- Progress charts (strength, body weight, workouts per week), workout history
- Two (or more) profiles, synced between phones through a Google Sheet
- Works offline at the gym

The app itself is in [`docs/`](docs/) (plain HTML/CSS/JavaScript, no build step).
The Google Sheet sync script is in [`apps-script/Code.gs`](apps-script/Code.gs).

---

## 1. Host your own copy on GitHub Pages (optional)

You can simply use the link above. To run your own copy:

1. On github.com, create a new repository, e.g. `rep12` (public, as free GitHub Pages needs that).
2. Upload this project. Either:
   - **Web:** on the repo page, click **Add file → Upload files** and drag in the `docs` folder, `apps-script` folder and `README.md`. Don't upload the photo folders.
   - **Command line:** from this folder:
     ```powershell
     git init
     git add docs apps-script README.md .gitignore
     git commit -m "Rep12 app"
     git branch -M main
     git remote add origin https://github.com/<your-user>/rep12.git
     git push -u origin main
     ```
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch: `main`, folder: **`/docs`**, then **Save**.
4. After a minute the app is at **https://<your-user>.github.io/rep12/**.

## 2. Install on your phones

- **iPhone (Safari):** open the link, tap **Share → Add to Home Screen**.
- **Android (Chrome):** open the link, tap **⋮ → Install app** (or "Add to Home screen").

Open it from the home-screen icon. The first screen creates your profile and plan. Add your partner from **Profile → Add a profile**, or on their own phone (sync joins them up).

## 3. Set up Google Sheets sync (optional, recommended)

Sync backs up both profiles and the gym setup and keeps both phones in step.

1. Create a new Google Sheet (any name, e.g. "Rep12 data").
2. **Extensions → Apps Script**. Delete the sample code and paste all of [`apps-script/Code.gs`](apps-script/Code.gs). Save.
3. **Project Settings (⚙) → Script properties → Add script property**: name `SECRET`, value = a long password you make up. Save.
4. **Deploy → New deployment → ⚙ Select type: Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy**, approve the permissions (it only accesses this one spreadsheet), and copy the **Web app URL** (ends in `/exec`).
5. In the app on each phone: **Profile → gear (Settings) → Sync with Google Sheets** → paste the URL and the same secret → **Save** → **Sync now**.

The app syncs automatically when opened, after each workout, and after changes. If both phones change the same profile while offline, the most recent change wins.

> If you later edit `Code.gs`, use **Deploy → Manage deployments → Edit → Version: New version** so the URL stays the same.

## 4. Optional: AI machine recognition

Off by default. When on, the "What is this machine?" screen gets an **Identify with AI** button that sends the photo to Claude through your Apps Script.

1. Get an API key at console.anthropic.com (pay as you go, a few cents per photo).
2. In Apps Script → **Script properties**, add `ANTHROPIC_API_KEY` = your key. Redeploy a new version.
3. In the app: **Profile → tick "Experimental: AI machine recognition"**.

The key stays inside your Google Script and never goes to the phones.

## Using the app

- **My Plan:** week X of 12, tap a day → preview the exercises, sets and rest → **Start**.
- **During a workout:** the black header shows the current set. Adjust reps/kg in the table, tap ✓ to log it. The rest timer starts automatically and beeps at the end (keep the phone's volume up). Changing kg on a set carries over to the remaining sets.
- **Starting weights are estimates.** Adjust them in your first week; after that the app progresses from what you actually logged.
- **Swap an exercise:** on a day preview, tap ⋯ next to an exercise.
- **Gym tab:** turn equipment on/off to match your gym, then **Rebuild my plan**.
- **Unknown machine?** Gym tab → **Add a machine with a photo**, answer a few questions about how it moves, and pick the match (or create a custom exercise with generated instructions).
- **Backup:** Profile → gear → Settings → Export file / Import file.

## Developing

Serve `docs/` locally and open http://localhost:8765:

```powershell
python -m http.server 8765 --directory docs
```

The service worker (offline support) only runs on https, so local edits show up straight away.
