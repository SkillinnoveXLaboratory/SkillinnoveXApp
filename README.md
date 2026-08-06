# SkillInnoveX App

Premium React Native + Expo frontend for the live SkillInnoveX platform.

## Run

```bash
npm install
npm start
```

Use Expo Go for development or an Expo development build for complete native file workflows.

Create an installable Android preview APK with:

```bash
npx eas-cli build --platform android --profile preview
```

## Architecture

- `app/`: Expo Router screens and navigation
- `components/ui/`: reusable native design system
- `services/api.ts`: centralized live-backend client
- `services/templates.ts`: dynamic website template discovery
- `storage/`: preview handoff and persistent download helpers
- `context/DownloadsContext.tsx`: AsyncStorage-backed download history
- `types/`: shared contracts

## Live Backend

Base URL: `https://skillinnovex.in`

Consumed routes:

- `GET /building` for dynamic resume template discovery
- `GET /portfolio` for dynamic portfolio template discovery
- `GET /cover-letter-generator` for dynamic cover-letter template discovery
- `POST /create-resume`
- `POST /create-portfolio`
- `POST /create-cover-letter`
- `POST /check-ats`
- `POST /api/humanize`
- `POST /download-generated-pdf`

Generated previews use a WebView only on the dedicated preview screen. All navigation, forms, tool interfaces, ATS results, Humanizer, and downloads are native React Native UI.

## Dynamic Templates

The website currently has no JSON template-catalog API. The app fetches the relevant public pages and extracts template IDs, titles, categories, and preview image URLs from their HTML. A minimal fallback template is shown if the website cannot be reached.

For the most robust long-term integration, the backend can later add a read-only `/api/templates` JSON endpoint without requiring changes to the app's screen architecture.

## Downloads

Generated remote files are downloaded into Expo app document storage when possible. Metadata is persisted with AsyncStorage and remains visible offline. The Downloads tab supports open/share, redownload, and removal.
