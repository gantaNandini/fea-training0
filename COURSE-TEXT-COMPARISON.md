# Original text vs developing website: comparison

Source: `Full_Course__Pressure_Vessel_Design.txt` (copied from https://www.fea-training.com/). The file holds **10 distinct courses** (some pages repeated). Current-site values are from the seed data; check the live admin for anything edited by hand.

## 1. What the import will change (exact original wording)

| Course (slug) | Title on developing site now | Title after import (original) | Level | What you will learn | Curriculum sections | Lessons (original) | Hours now → after |
|---|---|---|---|---|---|---|---|
| `full-course-pressure-vessel-design-dba` | Full Course: Pressure Vessel Design by Analysis (DBA) as per ASME Section VIII Div 2 | Full Course _Pressure Vessel Design DBA (ASME Sec VIII Div 2 and API 579-1 ASME FFS-1 ) by ANSYS | unchanged | 5 points | 44 | 140 | 19 h → 43 h (43:03:37) |
| `fatigue-ratchetting-creep-assessment` | Fatigue, Ratchetting, Creep Assessment of Pressure Vessels using ANSYS | Fatigue, Ratchetting, Creep Assessment (API 579-1/ASME FFS-1 - Fitness-For-Service & ASME 5.5 and 5.6 ) | Advanced | 9 points | 13 | 39 | 7 h → 7 h (07:07:33) |
| `3d-fracture-mechanics-simulation` | 3D Fracture Mechanics Simulation using ANSYS Mechanical | 3D Fracture Mechanics Simulation (API 579-1/ASME FFS-1 - Fitness-For-Service ) | Intermediate | 6 points | 8 | 48 | 5 h → 5 h (04:50:30) |
| `protection-against-local-failure` | 5.3 Protection Against Local Failure | 5.3 PROTECTION AGAINST LOCAL FAILURE (API 579 & FSS, ASME 5.3) and Buckling Load Assessment | Intermediate | 4 points | 8 | 18 | 2 h → 16 h (16:14:29) |
| `protection-against-global-failure` | 5.2 Protection Against Global Failure | 5.2 PROTECTION AGAINST Global FAILURE (API 579 & FSS, ASME 5.2) | Intermediate | 4 points | 10 | 28 | 4 h → 14 h (13:45:47) |
| `basic-fea-ahead-of-pressure-vessel-design` | Basic FEA ahead of Pressure Vessel Design | Basic FEA ahead of Pressure vessel, Centrifugal pumps and compressors, wind structures | Beginner | 16 points | 29 | 110 | 14 h → unchanged (no hours in text) |
| `ansys-training-mechanical-vibrations` | ANSYS Training: Mechanical Vibrations | ANSYS Training: Mechanical Vibrations | Beginner | 11 points | 12 | 43 | 6 h → unchanged (no hours in text) |
| `basic-fea-training-for-beginners` | Basic FEA Training for Beginners | Basic FEA Training for Beginners | Beginner | 4 points | 12 | 23 | 3 h → 8 h (08:19:27) |
| `rotordynamics-analysis` | Rotordynamics Analysis | Rotordynamics Analysis | Beginner | 15 points | 29 | 75 | 10 h → unchanged (no hours in text) |
| `advanced-fea-ansys-workbench-apdl` | Advanced FEA using ANSYS Workbench and APDL | Advanced Finite Element Analysis using ANSYS Workbench and APDL | Beginner | 22 points | 0 | 0 | 8 h → unchanged (no hours in text) |

Also replaced with original text: course description (all paragraphs, session lists, 'Course includes', 'Program overview'), tagline/short description, requirements. Subtitles are cleared where the original has none.

## 2. What is still missing or needs your input

1. **Two courses are not in the text file:** *ANSYS Training: Fatigue and Fracture Mechanics* and *ANSYS Training: Non-Linear Analysis*. Paste their pages and I will add them.
2. **Offshore Wind Turbine Structures (DNV)** is on the developing site but is **not on the original site**. Confirm it is a real upcoming course; its text was written by us, not taken from the original.
3. **Lesson names inside each module** are not in the text (the original page shows only module names and lesson counts). The import creates each module with the right number of placeholder lessons called *Lesson 1, Lesson 2 ...*. Rename them and attach videos/PDFs in Admin > Courses > Edit > Curriculum. Top-level lessons (with durations, e.g. *Substantiation of FEA*) keep their real names.
4. **Hours:** the text has hours only for 6 courses. Basic FEA ahead..., Mechanical Vibrations, Rotordynamics and Advanced FEA keep today's value; the original shows 0 or nothing for them.
5. **'Who can join' (eligibility)** text on the developing site is our wording; the original has no such section. Say if you want it removed.
6. **Levels** follow the original (for example *Advanced FEA* is labelled Beginner there). Tell me if you want to correct them.
7. **Odd original titles** are kept exactly, e.g. `Full Course _Pressure Vessel Design DBA ...` (underscore) and `5.2 PROTECTION AGAINST Global FAILURE`. Edit in admin if you want them tidier.
8. **Instructor biography** (Dr. Joel Daniel) is in the text and can be synced the same way; not done yet.
9. **Prices are not touched.**
10. Videos, syllabus PDFs: you will upload (not part of this).

## 3. How to apply
```
pnpm tsx scripts/import-fea-courses.ts scripts/fea-courses-full.json          # dry run: shows UPDATE lines only
pnpm tsx scripts/import-fea-courses.ts scripts/fea-courses-full.json --apply  # writes to the database in .env
```
A course that already has real uploaded videos/PDFs keeps its curriculum (only text is updated). After applying, open /admin, edit any course and Save once, or redeploy, so the cached pages refresh.
