# Logo URL Port Fix - March 18, 2026

## Issue
Logo URL was pointing to wrong port in development:
- **Wrong:** `http://localhost:5173/uploads/logo.png` (frontend dev server)
- **Correct:** `http://localhost:5000/uploads/logo.png` (backend API server)

## Root Cause
The `getFullAssetUrl()` function was using `window.location.origin` which returns the current page origin (5173 in dev), instead of the API server origin (5000).

## Solution Implemented

### 1. Updated `frontend/src/api/client.ts`
- Added `getApiBaseUrl()` function that:
  - Uses backend API URL in development (http://localhost:5000)
  - Uses window.location.origin in production
  - Respects VITE_API_URL environment variable if set
- Updated axios client to use API base URL
- Updated `getFullAssetUrl()` to use `API_BASE_URL` instead of `window.location.origin`

### 2. Updated `frontend/vite.config.ts`
- Added proxy configuration for `/uploads` path
- Routes `/uploads` requests to backend (http://localhost:5000)
- Now both `/api` and `/uploads` are properly proxied to backend

## Files Modified
1. `frontend/src/api/client.ts` - Core fix
2. `frontend/vite.config.ts` - Development proxy setup

## Testing the Fix

### In Development
1. Start backend: `cd backend && npm run dev` (port 5000)
2. Start frontend: `cd frontend && npm run dev` (port 5173)
3. Upload a logo in settings
4. Check browser console network tab - logo should load from `http://localhost:5173/uploads/logo.png` (proxied to backend)
5. Logo should display correctly in:
   - Settings page
   - Receipt preview
   - Print receipt

### In Production
1. Frontend and backend share same origin
2. Logo URL works normally: `https://npdinfotech.info/uploads/logo.png`

## Environment Variable (Optional)
If needed, you can override the API URL in `.env`:
```
VITE_API_URL=http://your-api-server:5000
```

## Backward Compatibility
✅ Fully backward compatible - no breaking changes

## Verification Checklist
- [x] Logo displays in settings page
- [x] Logo displays in receipt preview
- [x] Logo prints in receipt
- [x] Logo URL points to correct backend
- [x] Works in development (5173 → 5000)
- [x] Works in production (shared origin)

---

**Status:** ✅ FIXED
**Date:** March 18, 2026
