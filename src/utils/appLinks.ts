// Where the public site sends students. Shared by the landing page and the
// public navbar so the two cannot drift apart.

// accommo-mobile's browser build: hosted on Vercel, or the local `quasar dev`
// server (which lands on 9001 when accommo-web already holds 9000).
export const APP_URL = import.meta.env.DEV
  ? 'http://localhost:9001'
  : 'https://accommo-app.vercel.app';
// The app's root is GetStartedPage — the role fork a new visitor starts from.
export const SIGN_UP_URL = `${APP_URL}/`;

// Latest signed release APK, published by the mobile repo's CI.
export const APK_URL = 'https://github.com/Team-Dong-Dantes/accommo-mobile/releases/latest/download/app-release.apk';
