// No-op Vercel Routing Middleware.
// This static app does not use Next.js middleware. Keeping this file free of
// next/server imports prevents Vercel from building an unsupported Edge bundle
// if a stale or remote middleware.ts is detected.
export default function middleware() {
    return undefined;
}
