# Waitlist Quick Setup Guide

## Prerequisites
- MongoDB running locally or remotely
- Gmail account with 2-Factor Authentication enabled (for sending emails)
- Node.js 18+ and Python 3.10+

## Backend Setup (5 minutes)

### 1. Add Email Configuration
Add these variables to `backend/.env`:

```env
# Waitlist Email Configuration
WAITLIST_EMAIL=your-email@gmail.com
WAITLIST_PASS=your-app-specific-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### 2. Generate Gmail App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Scroll down to **App passwords**
4. Select **Mail** and generate a password
5. Copy the 16-character password (without spaces)
6. Use this as `WAITLIST_PASS`

### 3. Start Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Verify at: http://localhost:8000/docs

## Frontend Setup (2 minutes)

### 1. Install Dependencies (if needed)
```bash
cd frontend
npm install
```

### 2. Development Mode (Waitlist disabled)
```bash
npm run dev
```

Visit: http://localhost:3000/waitlist

### 3. Production Mode (Waitlist enabled)
```bash
export NODE_ENV=production
npm run build
npm start
```

Now all routes redirect to `/waitlist`!

## Test the Flow

### 1. Submit an Email
1. Go to http://localhost:3000/waitlist
2. Enter your email
3. Click "Join the Waitlist"
4. See success message

### 2. Check Email
Look for email with subject: "You're on the Glass Waitlist! 🎉"

### 3. Verify in MongoDB
```bash
mongosh
use llm_council
db.waitlist.find().pretty()
```

### 4. Test API Directly
```bash
curl -X POST http://localhost:8000/api/v1/waitlist/join \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 5. View All Entries (Admin)
```bash
curl http://localhost:8000/api/v1/waitlist
```

## Production Deployment

### Environment Variables
Make sure these are set in production:

**Backend:**
- `WAITLIST_EMAIL` - Your Gmail address
- `WAITLIST_PASS` - App-specific password
- `SMTP_HOST` - smtp.gmail.com
- `SMTP_PORT` - 587
- `MONGODB_URL` - Your MongoDB connection string

**Frontend:**
- `NODE_ENV` - production (auto-set by most platforms)
- `NEXT_PUBLIC_API_URL` - Your backend API URL

### Deployment Platforms

#### Vercel (Frontend)
1. Connect GitHub repository
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Deploy (NODE_ENV=production is automatic)

#### Render (Backend)
1. Create new Web Service
2. Add environment variables in dashboard
3. Set build command: `pip install -e .`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### Railway (Both)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

## Troubleshooting

### "Failed to send email"
- ✓ Check SMTP credentials in `.env`
- ✓ Ensure 2FA is enabled
- ✓ Use app-specific password (not account password)
- ✓ Check firewall/network allows port 587

### "This email is already on the waitlist"
- Expected behavior for duplicates
- Check MongoDB: `db.waitlist.findOne({email: "test@example.com"})`
- To reset: `db.waitlist.deleteOne({email: "test@example.com"})`

### Routes not redirecting in production
- ✓ Verify `NODE_ENV=production`
- ✓ Clear Next.js cache: `rm -rf .next && npm run build`
- ✓ Check middleware.ts is in `frontend/` root

### MongoDB connection error
- ✓ Ensure MongoDB is running: `mongosh` should connect
- ✓ Check `MONGODB_URL` in backend/.env
- ✓ Default: `mongodb://localhost:27017`

### Page styling looks wrong
- ✓ Check Tailwind compilation
- ✓ Ensure shadcn/ui components are installed
- ✓ Run: `npm run dev` to rebuild

## Architecture Overview

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │ 1. Visit any route in production
         ↓
┌─────────────────┐
│   Middleware    │ → Checks NODE_ENV
└────────┬────────┘   Redirects to /waitlist
         │
         ↓
┌─────────────────┐
│ Waitlist Page   │ → User enters email
└────────┬────────┘
         │ 2. POST /api/v1/waitlist/join
         ↓
┌─────────────────┐
│  Backend API    │ → Validates & checks duplicates
└────────┬────────┘
         │
         ├─→ 3. Store in MongoDB
         │   ┌──────────┐
         │   │ MongoDB  │
         │   └──────────┘
         │
         └─→ 4. Send Email
             ┌──────────┐
             │   SMTP   │
             └──────────┘
```

## File Structure

```
glass/
├── frontend/
│   ├── app/
│   │   └── waitlist/
│   │       └── page.tsx          ← Waitlist UI
│   ├── middleware.ts              ← Route protection
│   └── lib/store/api/
│       └── waitlistApi.ts         ← RTK Query
│
├── backend/
│   ├── api/
│   │   └── waitlist.py            ← API endpoints
│   ├── models/
│   │   └── waitlist.py            ← MongoDB model
│   ├── schemas/
│   │   └── waitlist.py            ← Pydantic schemas
│   ├── services/
│   │   └── email_service.py       ← Email sending
│   └── app/
│       ├── config.py              ← Config (updated)
│       └── main.py                ← Router (updated)
│
└── WAITLIST_IMPLEMENTATION.md     ← Full documentation
```

## Next Steps

1. **Customize Email Template**: Edit `backend/services/email_service.py`
2. **Add Analytics**: Track signup rate, conversion
3. **Admin Dashboard**: Create UI to manage waitlist
4. **Invite System**: Notify users when ready
5. **Referral Program**: Reward users for inviting friends

## Support

For detailed implementation details, see: `WAITLIST_IMPLEMENTATION.md`

For issues or questions, check:
- Backend logs: Look for "Waitlist confirmation email sent"
- Frontend console: Check for API errors
- MongoDB: Verify entries are being created
- API docs: http://localhost:8000/docs

## Security Checklist

- [ ] SMTP credentials in environment variables (not code)
- [ ] 2FA enabled on email account
- [ ] App-specific password used (not account password)
- [ ] MongoDB properly secured in production
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Rate limiting considered for production

## Performance Tips

- Email sending is async (doesn't block response)
- MongoDB email field is indexed for fast lookups
- Frontend uses RTK Query caching
- Middleware is lightweight (early return)

---

**Ready to launch?** 🚀

1. Set up email credentials
2. Deploy backend + frontend
3. Test the flow end-to-end
4. Announce your waitlist!
