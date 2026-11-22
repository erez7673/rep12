# Handover: exercise how-to clips (3D mannequin videos)

Read this together with `CLAUDE.md` (the "Exercise animations" section holds the full rules). This file records where the work stands and every approved Higgsfield still, so a new chat can continue without redoing anything.

_Last updated 2026-11-22, after batch 9, the Rep12 public release, the app tour, the Settings screen, US units and the 11 languages._

## Where things stand

- **Paused until next month (December 2026).** The Higgsfield credits ran out after batch 9. When they are refilled next month, we finish the remaining animations (batch 10, below).
- **Done and in the app:** 89 of the app's 105 exercises have male + female clips (`VIDEOS` in `docs/js/anim.js`): leg press plus batches 1–9.
  - The other 16 are the 9 in the table below, plus 7 cardio machines that were never planned for clips.
- **Git:** everything is committed and pushed (batch 9 is commit `da1264a`).
- **Credits: 0.66 left (paid "plus" plan, refreshes in December). Nothing can be generated until then.** A `gpt_image_2_6` image was quoted at 0.75 credits on 2026-11-21 (earlier notes said 0.25, so check with `estimate_image_cost`). A seedance video costs 2–2.5. Batch 9 used about 65 credits.
- **December budget:** batch 10 (9 exercises) about 35–45 credits, plus the equipment pictures about 35–50 credits (see below).
- **Always check the balance BEFORE sending a batch,** never in the same step.
- **Workflow with the user:** generate 10 exercises per batch, then send a review video and wait. When the user answers "Yes, push and continue", commit and push, then start the next batch. Never push without that answer.

## App changes since the clip work paused (2026-11-21, commit `ddd4158`, pushed)

The details are in `CLAUDE.md`.

- **Workout day view:**
  - The cardio finisher has a Change sheet, like the warm-up. It holds the machine and the minutes, and applies to that day in every week; 0 minutes leaves the finisher out.
  - The quick mobility routine is a button that opens the moves in a pop-up.
  - The exercise ⋯ sheet (swap list) has a close X. Swipe-down to close still doesn't work, and the user asked not to fix it.
- **Profile tab:**
  - **New "Build your custom plan" screen** (`#/custom`): exercises per day, muscle areas per day, session length, warm-up, cardio, injuries and extra focus.
  - **Edit profile** now ends at "Training days per week", which goes up to 7.
  - The new-profile form keeps everything except the muscle areas.
- **Planner:**
  - Up to 8 exercises per day, with new 6- and 7-day splits.
  - Muscle-area lists start over when they run out, so a day can reach 8 exercises.

These changes don't affect the clips. If a future change adds a JS or CSS file, add it to `FILES` in `sw.js`.

## Public release as Rep12 (2026-11-21, pushed)

- **New name and address:** the app is now **Rep12** at https://erez7673.github.io/rep12/. The GitHub repo was renamed from `fressi-workout` to `rep12`; the old address no longer works. Both users reinstalled from the new link. Their data carried over because the origin (`erez7673.github.io`) and the localStorage key `fressi.v1` stayed the same. **Never rename that key.**
- **No gym or brand names in the UI:** "Fressi Jätkäsaari", "Matrix" and "Gym80" were removed from Gym Setup (the categories are now "Weight-stack machines" and "Plate-loaded machines", with no "confirm" tags), exercise names, the machine wizard (Brand is free text) and the AI prompt in `Code.gs`. Picture captions and `alt` texts no longer show maker product names.
- **Added for the public:** a health disclaimer (welcome screen and Profile → About) and a privacy note (Profile → About). The README is rewritten for public users.
- **New equipment and exercise:** `decline-bench` (Decline / sit-up bench, under Benches & racks, off by default, no picture yet) and `decline-situp` (Decline Sit-Up, core, avoided for lower back and neck injuries). It needs a clip and a picture.
- **Day view:** each exercise has a move button (↕) that opens a "Change the order" sheet (Move up / Move down, "Back to the app's order"). A reordered day has `day.manual = true`, which `sortDay` respects.
- **Add to workout on a full day** offers Add or Swap. Adding raises the exercises-per-day setting (`raiseDayCap`: `p.stats.exPerDay`, or `plan.cap` for app-built plans), max 8.

## Languages, units and Settings (2026-11-22, pushed)

- **11 languages**, chosen under Profile → gear → Settings: English, Spanish, Portuguese (Brazil), German, Italian, Finnish, Swedish, Chinese (Simplified), Hindi, Arabic, Hebrew (Arabic and Hebrew right-to-left). All 1,221 texts are translated, including every exercise name, step and tip. The translations were written by Claude; a native speaker should review them before any marketing push.
- **US units**: lb and ft/in, with suggestions on a 5-lb grid. Data stays in kg/cm.
- **Settings screen** (gear on Profile): language, units, appearance, rest beep, sync, backup, About.
- **Custom plans** (saved from "Build your custom plan") keep the same sets and reps all 12 weeks; app-built plans step up and deload.
- **App tour**: starts once for new users, replay from Profile; sections Profile → Settings → My Plan → Workout day → Exercises → Gym → Timer → Progress.
- **New exercise clips need translations only for their name, steps and tip if they are new exercises**: run `node tools/i18n/extract.mjs`, add the lines to all 10 `tools/i18n/src/*.txt` files, run `node tools/i18n/build.mjs`. Clips themselves have no text.

## Accessibility (2026-11-22, pushed)

- **Accessibility screen** (person icon on Profile and on the welcome screen, also in Settings):
  - text size: Normal, Large, Extra large;
  - high contrast;
  - bigger buttons;
  - spoken workout cues (set logged, 10 seconds of rest left, rest over with the next set, timers done) in the app's language.
- **Screen readers (VoiceOver, TalkBack):** every button and input has a spoken name, icons are hidden from readers, sheets act as dialogs, the active tab is announced, and keyboard focus is visible.
- **Not done (the user didn't pick these):** reduce motion, seated / wheelchair-only plans.

## Still to do next month (9 exercises, cardio excluded)

| Group | Exercise ids |
|---|---|
| Calves (hard, see below) | `smith-calf`, `leg-press-calf` |
| Core | `woodchop`, `db-woodchop`, `pallof`, `ab-machine`, `rotary-torso`, `farmer-carry`, `decline-situp` |

`farmer-carry` was missing from the earlier lists (found 2026-11-21): it has neither a clip nor an SVG animation. It is a walking move, so a standing hold with a few steps in place is enough. `decline-situp` is new.

**Calf raises that failed in batch 8:** the video model turns a small ankle movement into a big one.
- `smith-calf` (3 tries, male and female): a single-still loop becomes a squat (the knees bend), even with "NOT a squat, knees locked" in the prompt. Edited top and bottom stills redraw the machine from a different angle, so the camera drifts.
- `leg-press-calf`: the female clip bent the knees like a leg press in both tries. The male single-still clip worked (job `143c5fbc-166d-4f14-a398-fa8892268b19`). It was not committed and the scratchpad copy may be gone, so download it again from Higgsfield (`jobs_wait` with that job id gives the URL), then convert it with `-r 24` and `enc.sh`, without bounce. Its start still is `b66c1b44-7a96-4741-947b-0e44fc1221dc`, the female start still is `e347c6bb-fa7b-4c11-9d51-302a29846862`.
- Ideas: a side view where only the feet are framed large, or a calf raise drawn as an SVG in `DEFS` instead of a clip.

**Batch 10 (next month, after the credit refill):** the 7 core exercises in the table, plus another try at the two calf raises. The Decline Sit-Up is a big pose change, so use the 21:9 two-keyframe method for it.

**Equipment pictures (also December, the user's decision):** replace every maker picture in `docs/js/pictures.js` with our own generic pictures without logos or brand marks, since the app is now public as Rep12.
- About 43 pictures: every `EQUIP_PIC` entry (some share one, e.g. abductor and adductor), plus `bb-bench` in `EX_PIC`, plus the new `decline-bench`.
- Generate them with `gpt_image_2_6` on Higgsfield: a plain product shot, black frame and dark upholstery, no logos, no text, on a white or light grey studio background (like the current tiles). Use the first approved picture as the style reference for the rest, so they match.
- Store them in the repo (e.g. `docs/media/equip/<id>.webp`, about 480 px), point `EQUIP_PIC` and `EX_PIC` at them, and remove the hotlinks to `gym80.de` and `assets.jhtbrand.co` (also their cache rule in `sw.js` and the `.thumb.pic.matrix` CSS). Decide whether they should work offline: anything under `/media/` bypasses the service worker today.
- Show the user a contact sheet before committing.
- First check the balance with `balance`.
- After batch 10, every non-cardio exercise has a clip.
- Cardio clips are optional and only if the user asks.

Static holds (`plank`, `side-plank`) need only a gentle breathing or hold motion.

Optional later: the batch 2 bench clips (`bb-bench`, `smith-bench`, `smith-incline`, `db-bench`, `db-incline`, `db-fly`) still use the older, higher camera and the old single-still method. The user has not asked to redo them yet.

## User requirements (all permanent)

- **Look:** grey faceless mannequin on a dark `#1c1c1e` background, with the worked muscles in **orange**.
- **Clothing:** men wear dark grey sports shorts. Women are edited from the male still, never made from scratch: ponytail, grey sports top and grey shorts.
- **Two-handed moves:** both arms move together.
- **Bar direction:** a barbell or Smith bar always runs **across** the body.
  - Bench exercises use the head-end three-quarter view (about 30° up, swung about 35°).
  - Standing exercises are shown from the front or a three-quarter front view.
- **Legs must look natural:** never "4 legs" (knees or feet appearing beside the shoulders), and never stretched.
  - Check the mid-rep and bottom frames of every clip at full size.
- **No "long body" distortion.** This is why every clip uses the keyframe method below.
- **Review before spending more:** after every 10 exercises, show the user before generating more.
- **Off-limits material:**
  - Never use RepDB artwork.
  - Never publish `Example App/` or `Fressi Gym equipment/`.

## Method (from batch 6 on)

1. **Make two keyframe stills per exercise:** a top-of-rep still and a bottom-of-rep still, with the same camera, zoom and body size.
   - **Small pose change** (arms and bar only): make the bottom still by editing the top still.
   - **Big pose change** (hinges, lunges, step-ups): editing re-frames the scene. Instead, generate ONE `aspect_ratio: "21:9"` image with "two animation frames side by side, same locked-off camera, same zoom, same size", using the approved top still as reference.
     - Split it with `tools/clips/split.sh`.
     - Run `tools/clips/align.py find` to get the sideways shift that lines up the planted foot or the equipment.
     - Run `tools/clips/align.py make` to write two aligned 576×576 frames.
     - Upload both frames with `media_upload` and run `tools/clips/put.sh` (it strips CRLF from the URLs), then `media_confirm`.
     - `size` values like `1024x512` fail; use `aspect_ratio` instead.
2. **Make the female pair** by editing the whole male pair image in one go. If a leg comes out stretched, edit the two male stills one at a time instead.
3. **Check the pair:** `tools/clips/pairs.sh` makes a 50% overlay. Only the moving limbs may show double.
4. **Generate the video:** `seedance_2_0_mini`, 4 s, 480p, 1:1, `generate_audio: false`, `use_unlim: false`. Use `start_image` = top still and `end_image` = bottom still.
   - The prompt must include: "Locked-off static camera, no camera movement, no zoom. Even soft studio light … no spotlight", plus "glowing orange highlighted <muscles> … stay visible the whole time". Without that phrase the orange disappears.
5. **Make the loop:** run `tools/clips/bounce.sh half.mp4 loop.mp4 check.png`. It plays the half rep at 2x and then reversed, giving a 4.13 s loop. In `check.png`, the head, torso and equipment must line up.
6. **Leg check:** look at the mid-rep and last frames at full size.
7. **Encode:** `tools/clips/enc.sh loop.mp4 <id>-m|f` writes `docs/media/anim/<id>-m|f.mp4` and `.jpg`.
8. **Register:** add the ids to `VIDEOS` in `docs/js/anim.js`.
9. **Verify:** check playback in the app (`preview_start` name `fressi`, go to `#/ex/<id>`).
10. **Review video:** build an xstack grid of all 20 clips and send it to the user.

**Image model:** `gpt_image_2_6`, 1:1, `use_unlim: false`, 0.25 credits per image. Pass references as `medias: [{value: <job id>, role: "image_references"}]`.

**Style reference:** the leg press male still `cc1a619b-2084-4fce-9fb2-e76b95e13c28`.

Every ID below is a Higgsfield job ID or uploaded media ID. Each can be passed directly as a `medias` value.

## Approved stills, by exercise

### Leg press and batch 1 (single still, start = end)

| Exercise | Male | Female |
|---|---|---|
| leg-press | cc1a619b-2084-4fce-9fb2-e76b95e13c28 | 76b41f3f-bc58-4032-81cb-c40d7ecc8b6d |
| machine-chest-press | 159e09c2-8f5d-4640-b771-1ad88f7632fb | 26333113-af37-4e6b-bd53-992c0e6dfb22 |
| machine-shoulder-press | a47634e4-144e-4d61-9c41-7118e8c86603 | d5471aee-1789-4268-87ab-deda12e58250 |
| pec-deck | c8571158-4ee6-4053-b136-db20224e12ed | 81429951-9bd3-41b9-a7d3-1d4d2ed85075 |
| lat-pulldown | b5501f96-4cec-449d-92ed-04db69540d43 | f7cd6cdf-d25f-42c9-a351-88dd3cff6d0d |
| seated-cable-row | 5e156ce0-2fa3-4112-a52c-1307b40a2bef | 7768d3c3-3bd7-4873-9b98-0c9697139a25 |
| machine-row | b1ec1293-4783-4922-8c63-26ec0108f614 | 1526a273-4f29-4c50-884e-fce9787b9495 |
| leg-extension | e317ddca-9094-4688-99a5-611be4bb341f | 9faab354-2c94-40c1-a77a-b603db24662c |
| leg-curl | e1c1b8b7-edb1-4ce8-823e-130497bdcd82 | 37b0b308-92e8-4e13-8299-740b3dfba82a |
| hack-squat | 5c9ae4bb-acb1-4cbc-99b8-f96483e1d0f6 | 55f4019f-cc0e-4189-90d5-abe1a7cbbf26 |
| hip-thrust-machine | 17f72365-e3b4-49de-b05a-d2350d42939e | 95ab8ab1-caa6-4d09-ae3d-ee57a04aa9f7 |

### Batch 2: chest (single still)

| Exercise | Male | Female |
|---|---|---|
| bb-bench | c00982b4-39b0-4fbf-a49b-5d0ffa448690 | 477a375f-c452-46d2-94a4-35990bcfcedd |
| smith-bench | 2e688d5f-ad30-4b10-ac79-48e0bf8b6bab | fd81e65c-95b5-46be-b6d9-2dc141ef341f |
| db-bench | 2a2e2c3b-c015-479e-a2f5-2f2ff696ee66 | 4ead0dbe-3d80-45b7-a776-838fe420a00d |
| db-incline | 592104e5-a831-4545-9852-1e10d84a0205 | eca2c5b5-f274-4920-9413-a84e4d12166e |
| smith-incline | 6eae8ea1-296a-41be-834a-ac024747ed28 | c3412006-ec40-4a75-a4dd-a14f8d22f898 |
| plate-chest-press | f7f35753-a22f-4d2f-980f-134cca132efd | c37e7b34-bd06-4320-b60e-a64ce466a364 |
| plate-incline-press | cc8637c3-bc11-40c4-9f42-1c64634e5503 | 9b3f642b-f73c-4824-9993-c48e45f37ede |
| pushup | 7d178ac7-262f-47c1-95f5-4b9d83b0cda6 | 48699919-dcd4-48a4-8132-b6f26cce2a2f |
| cable-fly | 4d64bfce-18ba-4e7a-9088-53a40e5b5c96 | ec93b7cb-6ba1-4b86-9b1d-34659a793feb |
| db-fly | 37a057cb-862d-4471-9d62-845f46ed4522 | 64ede3bf-4dc6-469f-bbee-3165e3993050 |

### Batch 3: shoulders and pulldowns (single still)

| Exercise | Male | Female |
|---|---|---|
| db-shoulder-press | de057056-764f-4dd8-8b61-725d6e28125c | cc925cd1-5933-470c-8a29-4477c5873775 |
| smith-ohp | bad68235-4f7c-4673-ade0-0f71e2070058 | 0a7939ba-fdf6-447d-aa22-168f3799f1d7 |
| bb-ohp | cc06fa5b-7ee6-428a-94f8-10006a2bf7eb | fc55ab9f-d0d7-49d4-955a-ba3b53f3246e |
| arnold-press | d8082e5d-aa2b-4bf5-8b54-865df9d5317b | 4d993cd1-7d0d-49e1-9d9f-ebf7da851302 |
| db-lateral | 9bd5b36b-5bbf-416c-aa90-4faca062695d | 2b3fa396-fc41-4d1e-bb3e-955d66c9bdfb |
| cable-lateral | 939dfa9a-555d-4f15-98f0-ff2e035bc37e | 2cea6113-6b83-45bb-8472-c95c3eb7d132 |
| face-pull | 6c0b2f72-f3e5-4247-87ce-d456085d8a11 | b20bcd5d-c38f-48f7-99ba-29ef7ccb1bfa |
| db-rear-fly | 689b350f-8687-4865-b839-85debb9a169b | cf5f333f-92b1-40a5-a8bd-99491fcdaf51 |
| close-pulldown | 765d6806-8038-4527-93ec-8ada01699fc0 | 94072adc-945e-4f3f-9ff6-12efb86639ae |
| assisted-chin | da025bcf-5627-4882-bb0c-0053027a2a04 | bbaccede-8358-4800-a7d6-55958999de99 |

### Batch 4: back and traps (single still)

| Exercise | Male | Female |
|---|---|---|
| reverse-pec-deck | 899b9aea-7212-4d35-8231-2ed347075cea | a0f83752-2ebf-4c5a-9d1c-acee5bfdca03 |
| pullup | cba5baaa-6986-4aaa-be8a-ff72986304ab | 4778f2d0-4eeb-449e-b818-078c2a195fc4 |
| straight-arm-pulldown | 8f2d80f6-8026-4ae8-ba51-0e2a626a4dc7 | 4dabc2fb-23d1-474c-bad9-c99dd2c75f8c |
| crossover-row | 7d0968c6-0ef4-4be9-bd34-79d6f151dc19 | 6ffe3397-00f0-47b8-8d01-4f958d2e6e34 |
| plate-row | 02014824-e842-4619-9552-40af383f6ed1 | 5ed88202-efd1-40f6-8107-4c7cc4953032 |
| db-row | 735cd611-fa63-4940-83cd-0800ade3f3b8 | 9c252676-f44a-4665-91fd-b512bccee459 |
| incline-db-row | de69e55a-ee88-4b81-bd37-b4f8c45d1e46 | 7e8083fd-125b-4724-9a38-3133cad9185f |
| bb-row | 0b58ae5f-2668-4273-9c74-88f199972eed | 482ae6a9-decc-4bf9-b9a6-7be67a71fe21 |
| trx-row | 97ae1835-c2a2-4889-88f9-8a3a4f3d14a7 | cd161710-fba5-4a1c-ab88-8802f2486d0a |
| db-shrug | cff626c0-ea62-470b-bff9-2f5bb11ad4d0 | ed06ad2f-97d7-4a3b-af01-5762e5a69192 |

### Batch 5: shrugs, biceps, triceps (single still)

| Exercise | Male | Female |
|---|---|---|
| smith-shrug | 26af409d-273e-415f-8f06-1d7ee19230e0 | 565e4c47-0a5d-4694-aa88-f89cd887e23f |
| db-curl | d023d067-015a-4b9c-9836-93f5f7ba2ca4 | cee0036e-7d95-4ef2-95f9-1615701d994b |
| hammer-curl | 700cba28-e404-467b-a1b7-72c2693d218b | 2c147160-0440-47e3-ad9a-e8f2dc1b1f59 |
| ez-curl | 1e953dc3-af77-4e9c-bf26-b19aa4bb54e1 | 61bdfa9b-895b-4c9f-ab4a-d6dd402af7dc |
| preacher-curl | de643838-af68-4ea8-b1b0-48b120c9f499 | c2e39cdd-0efe-412e-b489-00a0663ed65f |
| cable-curl | 7c238013-1d80-4b59-9c4c-23d442144d84 | ca5d7e39-8f15-42a7-8d7e-74a25f4826ac |
| incline-db-curl | fbd0140f-b53b-45f9-a85f-87f3e23c9621 | f8d8fa71-0565-438a-8268-0d5511aca39f |
| rope-pushdown | eb528c0c-e3f3-4eef-8fab-f2ef0149a9c8 | 82254794-8016-4e65-86be-7ef5959f19f3 |
| bar-pushdown | b09a1c7d-cd51-437d-986d-bb490401104a | a1072ae6-5a80-4b72-a5ec-6d57e3f11726 |
| overhead-cable-ext | 667d1037-0e17-4942-81c6-aa4cc3605303 | 8a304a78-77a1-4039-bde7-53adec7281e2 |

### Batch 6: triceps and squats

Single still, except the two bench moves, which use top and bottom keyframes.

| Exercise | Male | Female |
|---|---|---|
| db-overhead-ext | d9244f6f-65ba-4792-9bb7-70368951531a | 80341c06-58ee-49f6-854f-bacf013b283e |
| skull-crusher (top → bottom) | 8e27617b-62cf-46b0-9164-8f76769552e0 → 7dd68d21-9062-46dd-93ea-ac6280b8504d | 47cbd686-b508-433b-8c4a-76415afa8186 → 5223226a-520c-4def-90a4-0c498cffbd8c |
| close-grip-smith (top → bottom) | c6ba2ecc-6b26-43fa-8c43-036345bbfe54 → e537cf2f-d7a9-4019-aee6-a88f670d366c | bc2e0de2-c038-42a1-b26d-e73660bb9e59 → 3e58e4e8-c9cf-460d-b867-b279ed56c819 |
| assisted-dip | 400a1a01-b386-4ce1-901e-955b84c5e825 | 90c93aad-a7e0-4446-946a-b8ba63e4ee67 |
| triceps-machine | 29db81f6-78ce-4ee0-b815-a3d0817ac0ab | 2e8f1463-4e2b-46a9-96a6-d2b3d67073ac |
| bench-dip | db7e37b7-cfa9-4cdc-a552-03a9500f1d8b | 5a9fca08-a593-4dc2-8449-251c0e2e804f |
| bb-squat | 49df4a88-bcfa-42d0-b329-272d693944f0 | 053d99ee-004a-4e17-8bc6-6fa933534eea |
| smith-squat | ed52e8c8-cf12-4dc8-a996-1588b8e6c414 | 47af14cb-b340-4803-b43f-d2ecf28e6296 |
| goblet-squat | a045ae96-8bca-4325-9cc5-3a3fed0f6ae9 | d69deffa-9b1a-43ed-a146-8aded95b9cc1 |
| sumo-squat | 7a770418-41b9-4bbf-abfe-ca172792b32c | 944095d7-3ebd-49e6-889a-18f2ccd11aa4 |

### Batch 7: hinges and lunges (keyframes, top → bottom)

The "pair" columns are the original 21:9 side-by-side images. The keyframes were cut from them, aligned and uploaded.

| Exercise | Male top → bottom | Male pair | Female top → bottom | Female pair |
|---|---|---|---|---|
| rdl | ed829451-ba31-48d3-a87f-382885655839 → 03db6bb9-c5c7-4dee-b792-f141ee8f771c | d18dd729-38f9-4002-8a83-34165f9efee4 | 2425ec43-ebfb-49fc-8a4e-5d9ea08f9f0a → 683be95c-8cb2-4d61-b951-e9811e1773b0 | a188e112-3ab8-4432-b830-90dd7d793512 |
| db-rdl | 48eb97ff-bcf5-4cf5-a21b-8b734e7e4cf7 → 0cf9b18a-0bd2-483d-b869-af3bb1a6e072 | 220f45c0-6e6e-4b1e-9119-4eab2f7dac3d | f7a20f6f-b87f-4785-8567-05d27454107a → db6c97be-9c03-428d-975f-c68c0f80bf74 | cc5e7d9d-e9de-47a3-ab3c-8dfdab9d797b |
| smith-rdl | 7f717109-8607-4546-9e0f-9e3baa0983fc → bd853cf8-3d76-4e0f-8959-2aad92cd38e0 | e581dffe-1fab-4954-b092-7f65bfd60af4 | b3351ecf-4ed7-4f74-b78e-2410bbf0febe → 24f88fe1-2fe6-4256-837c-f6eed1e50b57 | f2cdcd31-2f8e-48f7-bd51-9f99938916c5 |
| deadlift | e071dcae-9a07-42fe-8b29-cef10bc550b1 → a06b78ae-ceee-4ce2-94e6-60c12cff9951 | f8f010b1-49b4-4de1-95a4-0ce9c1447116 | ac9ceca9-36cb-42e1-ab90-f1456a22ff31 → 6cd528d1-5fb1-4a9a-9285-668fa28fa70f | bf4ce11d-9ab5-49a2-97d3-1d93ebdefb7e |
| back-ext (redone face-down 2026-11-21) | 1f200a6b-0cdd-41d7-be85-f55eaa7e6c84 → e251ef6e-e1e9-458a-804d-cd998ae7fedb | 2a55f896-edb1-411d-9d81-9b5491bee574 | 2e30670f-509e-4b70-a2f0-eb2bdb510adc → b9cdb080-f405-4311-a283-0a27ce2dfc61 | dd278106-4efc-40f2-b452-9755f17a2c9f |
| cable-pull-through | 56326795-c271-4182-a05a-003fb5cbf4d9 → a8234607-57e9-4433-a851-cd574d38e81f | n/a (edited stills) | 139e9d9a-0143-4a47-a4fc-b41fade45137 → 7c2f4f2c-1a58-49f9-811a-f4ad3a25bf30 | d06b5f62-d2d5-4914-8711-f2a3f6b8ec78 |
| db-lunge | fbc556d5-1772-4a21-afdd-0293bbadb35b → 488cb303-9ec8-4d4c-b07a-2acd5b8e6689 | a1ae53cc-727d-48c5-9bbb-7bbffa9a1216 | 753e7ce2-7c3f-448d-823c-b86e1277a6c0 → 73a14c63-6664-4b16-8b31-e1e0fea59566 | bd6fdec9-0da1-41a4-823f-fc6cb32d9d00 |
| reverse-lunge | 71bf518f-ed0b-4580-8a3d-ed03988e9ef3 → 4e3c7af7-454b-4a33-bc12-ed1627965d18 | c1f4208b-c9b5-49d5-92d4-bb55d8a73971 | f1d14a06-5007-40db-89d7-6cfe1562987e → 1ec438e9-eb76-477c-beda-536ebc8a1be2 | 8df2f84c-df37-49f9-8901-5c06e92c4333 |
| split-squat | 15fb5b86-2e69-400d-a701-b8fabeb605fc → 35e4fbcb-9218-4b57-b39b-fd2519fa7c85 | n/a (edited stills) | e9654029-b949-4244-9c46-6354d1c2c1e6 → aa2c3dca-72f7-42f5-af09-fe3f73fab821 | n/a (edited one by one) |
| stepup | 7cafd201-1c2d-4bb9-b8e7-67b6ddb6aac2 → 1af5f7fb-8b85-4b89-8f22-5fc4a9798978 | 94bc6d46-fc2c-4a6d-ae9a-dcab4a0240e9 | 87d197db-423d-4108-9d68-477b251b2cb9 → ebc85190-6d34-4510-ab33-e10781df5f6b | 4cf5b8df-033d-4a1e-bb99-84b1e9019686 |

Batch 7 alignment shifts (`dx` for `align.py make`, male / female):

| Exercise | Male dx | Female dx | Anchor |
|---|---|---|---|
| rdl | -34 | -32 | feet |
| db-rdl | -56 | -50 | feet |
| smith-rdl | -2 | -2 | machine |
| deadlift | -24 (dy 4) | -22 (dy 4) | feet |
| db-lunge | -205 | -205 | back foot |
| reverse-lunge | +110 | +110 | front foot |
| stepup | -84 | -84 | bench |
| back-ext | -12 | -12 | bench (`box:0.15,0.95,0.6,0.97`) |

The first back-ext clips were wrong: the body lay face-up, like a backbend. A back extension is face-down: the hips rest on the pad, the chest faces the floor and you see the back of the head. The male video came out reversed (bottom → top), so it was flipped with `-vf reverse` before `bounce.sh`; check each video's direction.

### Batch 8: glutes and calves

Start → end stills as used for the videos (job IDs or uploaded media IDs). "Pair" = 21:9 pair cut with `align.py`; "edit" = the end still is an edit of the start still (checked with `align2.py`); "single" = start = end, and the video plays a full rep that is used as the loop without `bounce.sh`.

| Exercise | Method | Male start → end | Female start → end |
|---|---|---|---|
| hip-thrust | edit | 0a2a8e90-53ec-4776-8c95-02762b55886c → 15435f0f-54b9-4a10-8631-8373a61b8f38 (video was a full rep, used without bounce) | 20a54e10-1da8-45a2-bf43-5b662b7335b5 → 411910da-eb1e-4b08-b03b-49db01c05f4b |
| smith-hip-thrust | edit | 73c497c9-09a6-49d4-a149-1794eb746e0a → 9e0832ee-6516-416a-abb7-9a1583f413d6 | 56e68679-0d7e-46ab-a2e8-8596471a8ddb → 2efc15a0-18d7-4bc1-a462-e4efa192fc76 |
| glute-bridge | pair (64db04e7 / 790d596a) | f7e145f6-2113-4b0f-ad51-4fd0a5ab9807 → d715c886-b95a-426b-a7a2-578a217c3aa2 | c46db44b-d778-46ef-a8c8-ebd6af9fa56a → 6763d3bf-7fe2-4dbe-8897-4075747f7752 |
| abductor | edit | 027aeb04-d112-4be4-ab7e-d8c84afaebd3 → 774afeb0-73c6-4f07-bc00-090fa0cbf86b | 59dec49d-14b6-46fe-ac7d-5fee01833c84 → 0dd637a5-84e0-47ab-9114-1fae00fb431b |
| adductor | pair (fc86e897 / 0d65344c) | b2227a5f-e913-4efd-a72d-008b3e2ca49e → ab3ae09d-54aa-48ef-8d72-fface44a5de0 | a4422e23-136f-40bc-93a4-57c4e0e9b359 → 52c6739f-e868-4201-8309-45072ce1790c |
| cable-kickback | pair (3ffeb06f / 2d4e09aa) | 21086155-435d-42dc-ae24-005683268f35 → 4b284230-e7f5-4a14-8122-020762628119 | ff2b8f1a-acad-4900-9714-fccea381d25c → 0f6b3b2e-453e-43e2-a7bd-199ab9d50a7d |
| db-calf | pair (d52a6b2d / 8104d5f3) | 2451e28d-d691-4e94-8464-f3a868543fdd → d69b36e1-b563-49ee-82e2-8a1ae107bf56 | 2b5323b4-e3c3-4714-8746-cac85a73cb71 → 3d66b81a-e1cb-4fc4-861f-fa43af52a395 |
| calf-machine | pair (35c135bd / 9814974a) | 5e038c18-e228-4c2e-8863-d822bcd49870 → b6df70df-c2e6-4421-aa75-53dc688123ca | 8ebba6f3-af68-4e6d-a5ec-54c36cb784bd → c7142c87-e493-406c-bdd7-72034abcdef6 |

Batch 8 lessons:
- **Hip thrusts:** 21:9 pairs let the feet slide sideways between the halves. Editing one still ("feet stay planted in exactly the same spot") worked better.
- **When an edit seems to zoom:** check it with `tools/clips/align2.py A.png B.png box:x0,x1,y0,y1 out.png ov.png`. It finds the scale and shift that line up the equipment.
- **Known flaw, `db-calf`:** the person stands on their toes just in front of the step instead of on its edge.

### Batch 9: chest leftovers, Smith split squat, core

All raw job IDs, including rejected tries, are in `tools/clips/b9ids.txt`. Videos used:
- **Pair route** (21:9 pair, split, `align2.py`, then upload): `cable-fly-low`, `cable-fly-high`, `smith-split-squat`, `knee-raise`, `hanging-leg-raise`, `cable-crunch`.
  - The male `knee-raise` video was a full rep, so it is used without bounce.
- **Edit route:** `incline-db-fly` (male start upload `ab7fc761-33e2-426a-8055-61ab7bd58400` → `c6eb3268-34a0-4e74-a742-ceca03fe2e49`, female `61b30aa3-be95-446a-8e68-7db98b9e3be5` → `b796a6fc-6542-48dc-8be7-350378d5ac13`) and `dead-bug` (male `55c959b1-b8fb-4c14-9619-eab907f9a4a5` → `8f822f2b-5485-4fc3-aaf4-36abd0cc81e4`, female `ab8fe392-0c4d-4750-b72c-f901c4ab80db` → `ee03f2e3-53d9-4044-b207-5d7cf60259a5`).
- **Single still** (start = end, a "breathing hold" prompt, used without bounce): `plank` (male `e40c637e-01d7-4443-8ecd-c00ec26e397e`, female `f124cee8-1c39-4868-8bdf-3427ce25f244`) and `side-plank` (male `7fe2293c-85b8-4344-83fa-e3bf882ab213`, female `7fc6b4e4-0c5e-4363-b581-fe668f39ebbd`).

Batch 9 lessons:
- **Captain's chair:** say "NO seat, supported on the forearms", or the model draws a chair to sit on.
- **Incline bench:** the first try came out flat. Editing the pair ("backrest raised 30°, head higher than hips") fixed it.
- **Dead bug:** the first videos grew a third leg mid-move. Retrying with "exactly two arms and two legs the whole time; ONE bent leg straightens, the other stays" fixed it.
- **Knee raise:** one female video zoomed in. Adding "wide shot, whole body and station in frame, no crop" fixed it.
- **Hanging leg raise:** both clips swing a little at the start of the rep.
- **Batch uploads:** a `media_upload` of 12 or more files overflows into a saved JSON file. Pass that file straight to `put.sh` (`put.sh <file> <dir> names…`), with no copy-pasting of URLs.
- **`check.sh <dir> name=url …`:** downloads clips, builds the bounce loops and a review row per clip, and prints how different the start, middle and end frames are. When start ≈ end, the clip is already a full rep.

**Good references for new exercises:**
- **Standing with dumbbells, three-quarter view:** db-rdl male top `6e6a66c8-97bb-41b3-ae30-9e76e06b5fc9`, db-lunge male top `f0dea8c5-cf15-4552-b90d-6b37d3cefc0f`.
- **Standing barbell:** `1329aae5-b9e3-4de7-89a5-886d52763b79`.
- **Smith machine, three-quarter view:** `b780de92-6791-4cf2-9cdb-0829f9d42ddd`.
- **Flat bench and body proportions for bench work:** `c00982b4-39b0-4fbf-a49b-5d0ffa448690`.
- **Cable tower, side view:** `56326795-c271-4182-a05a-003fb5cbf4d9`.
- **Leg press:** `cc1a619b-2084-4fce-9fb2-e76b95e13c28` (useful for leg-press-calf).

## Files

- `tools/clips/`: helper scripts.
  - `stills.sh` plus `sheet.py`: contact sheet of stills.
  - `grab.sh`: frame strips from videos.
  - `split.sh`, `align.py`, `pairs.sh`: keyframe pairs.
  - `align2.py`: scale-and-shift alignment of an edited still onto its base still.
  - `check.sh`: batch download, loop and review rows for finished videos.
  - `put.sh`: uploads.
  - `bounce.sh`: loop plus overlay check.
  - `enc.sh`: encode into `docs/media/anim`.
  - `b*ids.txt`: raw job logs per batch, including rejected tries. Use the tables above for the approved ones.
- Work in the session scratchpad, not the repo; `enc.sh` writes its temp files to `tools/clips/enc/`.
- Gotchas:
  - On Windows, ffprobe and Python output has CRLF line endings, so pipe it through `tr -d '\r'`.
  - The project path has spaces, so quote it.
