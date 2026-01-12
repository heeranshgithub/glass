# Middleware Verification Guide

## Production Mode Behavior

When `NODE_ENV === 'production'`, the middleware enforces that **ONLY `/waitlist` is accessible**.

### ✅ Allowed Routes (Production)

1. **`/waitlist`** - The waitlist page (ONLY user-accessible route)
2. **`/_next/*`** - Next.js internals (required for app to function)
3. **Static files** - Images, fonts, CSS, JS (`.ico`, `.png`, `.jpg`, `.svg`, `.woff`, etc.)

### ❌ Blocked Routes (Production)

All other routes redirect to `/waitlist`:
- `/` (root) → redirects to `/waitlist`
- `/login` → redirects to `/waitlist`
- `/register` → redirects to `/waitlist`
- `/home` → redirects to `/waitlist`
- `/chat/*` → redirects to `/waitlist`
- `/settings` → redirects to `/waitlist`
- `/leaderboard` → redirects to `/waitlist`
- Any other route → redirects to `/waitlist`

## Development Mode Behavior

When `NODE_ENV !== 'production'` (development):
- ✅ All routes are accessible
- ✅ No redirects
- ✅ Full app functionality available

## Testing the Middleware

### Test in Development
```bash
# Development mode (NODE_ENV is not 'production')
npm run dev

# All routes should work:
# - http://localhost:3000/ → works
# - http://localhost:3000/login → works
# - http://localhost:3000/waitlist → works
# - http://localhost:3000/home → works
```

### Test in Production
```bash
# Set production mode
export NODE_ENV=production

# Build and start
npm run build
npm start

# Test routes:
# - http://localhost:3000/ → redirects to /waitlist
# - http://localhost:3000/login → redirects to /waitlist
# - http://localhost:3000/waitlist → ✅ WORKS (only accessible route)
# - http://localhost:3000/home → redirects to /waitlist
```

### Manual Verification

1. **Start in production mode:**
   ```bash
   NODE_ENV=production npm run build && npm start
   ```

2. **Test each route:**
   - Visit `http://localhost:3000/` → Should redirect to `/waitlist`
   - Visit `http://localhost:3000/login` → Should redirect to `/waitlist`
   - Visit `http://localhost:3000/waitlist` → Should load waitlist page ✅
   - Visit `http://localhost:3000/home` → Should redirect to `/waitlist`

3. **Check browser console:**
   - No errors should appear
   - Redirects should be instant (301/302)

4. **Check Network tab:**
   - Root route should show 307 redirect to `/waitlist`
   - `/waitlist` should return 200 OK

## Middleware Location

The middleware is located at: `frontend/middleware.ts`

It runs **before** any page component loads, so:
- Client-side redirects in components won't interfere
- The middleware catches requests first
- Redirects happen at the edge (fast)

## How It Works

```typescript
// 1. Check if production
if (NODE_ENV !== 'production') {
  return NextResponse.next(); // Allow all routes
}

// 2. Check if allowed route
if (pathname === '/waitlist') {
  return NextResponse.next(); // Allow waitlist
}

// 3. Check if Next.js internal
if (pathname.startsWith('/_next')) {
  return NextResponse.next(); // Allow Next.js
}

// 4. Check if static file
if (pathname.match(/\.(png|jpg|svg|...)$/)) {
  return NextResponse.next(); // Allow static files
}

// 5. Redirect everything else
return NextResponse.redirect('/waitlist');
```

## Common Issues

### Issue: Routes still accessible in production
**Solution:**
- Verify `NODE_ENV=production` is set
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`

### Issue: Static files not loading
**Solution:**
- Check file extensions in middleware matcher
- Verify files are in `public/` directory
- Check browser console for 404 errors

### Issue: Infinite redirect loop
**Solution:**
- Ensure `/waitlist` route exists
- Check middleware matcher config
- Verify no conflicting redirects in page components

## Verification Checklist

- [ ] Development mode: All routes accessible
- [ ] Production mode: Only `/waitlist` accessible
- [ ] Root `/` redirects to `/waitlist` in production
- [ ] `/login` redirects to `/waitlist` in production
- [ ] `/home` redirects to `/waitlist` in production
- [ ] Static files load correctly (images, fonts)
- [ ] Next.js internals work (`/_next/static/*`)
- [ ] No console errors
- [ ] Redirects are fast (< 100ms)

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. **Vercel automatically sets `NODE_ENV=production`**
   - No action needed
   - Middleware will automatically activate

2. **Other platforms:**
   - Set `NODE_ENV=production` in environment variables
   - Or ensure production build is used

3. **Verify after deployment:**
   - Visit your production URL
   - Try accessing `/login` or `/home`
   - Should redirect to `/waitlist`
   - Only `/waitlist` should be accessible
