# Kalaprayag

A short description of the project — what Kalaprayag does and who it's for (1–2 sentences).

Badges
- Build / CI status badge (add after you enable CI)
- License badge

Table of contents
- Features
- Tech stack
- Demo
- Getting started
- Environment variables
- Available scripts
- Deployment
- Contributing
- License
- Contact

Features
- List the main features or pages of your app (e.g., interactive map, event listings, Firebase integration).

Tech stack
- TypeScript, React (or React + Vite), Firebase (if used), Vite, etc.

Demo
- (Optional) Add a screenshot or link to a live demo.

Getting started

Prerequisites
- Node.js 18+ (or the version you support)
- npm (or yarn/pnpm)

Clone and install
```bash
git clone https://github.com/srastogi226-spec/Kalaprayag.git
cd Kalaprayag
npm ci
```

Run locally
```bash
npm run dev
# then open http://localhost:5173 (or your port)
```

Build for production
```bash
npm run build
npm run preview  # preview the production build
```

Environment variables
- Do not commit sensitive files (e.g., `.env.local`) to the repository.
- Create a `.env.local` file from `.env.example` with your own values.

Example `.env.example` (see file in repo root)
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
# add any other env vars your app uses
```

Available scripts
- `npm run dev` — start dev server
- `npm run build` — build for production
- `npm run preview` — serve built app locally
- `npm test` — run tests (if added)
- `npm run lint` — run linter (if added)

If these scripts are not present in `package.json`, add them (or update this README to match your scripts).

Deployment
- Short instructions how to deploy (e.g., Vercel, Netlify, GitHub Pages, Firebase Hosting).
- Example: Deploy to Vercel — push to GitHub and connect the repo to Vercel; set environment variables in Vercel dashboard.

Security and secrets
- Remove secrets from commits. If any secret was committed (for example in `.env.local`), rotate those keys immediately.
- Add `.env.local` and any other secret files to `.gitignore`.

Contributing
- Short guidelines: open an issue first, fork the repo, create a branch `feat/xxx` or `fix/xxx`, make changes, open a PR with description and screenshots.
- Optionally add a `CONTRIBUTING.md` with more detail.

License
- Add a `LICENSE` file (MIT is common). Add license badge at the top.

Contact
- Your name / email / link to GitHub profile.

Changelog / Releases
- Optionally maintain `CHANGELOG.md` or use GitHub Releases for public changes.

Notes
- If your repo currently includes `node_modules/`, `.DS_Store`, or `.env.local`, add them to `.gitignore` and remove them from the repository history or at least from the current tree (see next steps in repo hygiene).