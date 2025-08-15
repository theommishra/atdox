# Google OAuth Setup Guide

## 🚀 What We Just Built

1. **Auth Callback Page** (`/auth-callback`) - Handles OAuth redirects and stores JWT tokens
2. **API Utility** (`/utils/api.ts`) - Makes authenticated requests with stored tokens
3. **Dashboard** (`/dashboard`) - Shows user's projects after authentication
4. **Onboarding** (`/onboarding`) - Welcome page for new users

## ⚙️ Configuration Steps

### 1. Update Google OAuth Console

Go to [Google Cloud Console](https://console.cloud.google.com/) and update your OAuth 2.0 client:

**Change the Authorized redirect URI from:**
```
https://your-backend-name.onrender.com/api/auth/google/callback
```

**To:**
```
https://your-frontend-domain.com/auth-callback
```

### 2. Set Environment Variables

Create a `.env.local` file in your web app root:

```bash
# Backend API URL (your Render backend URL)
NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com

# Optional: Google OAuth client ID (if needed on frontend)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Update Your Sign-in Button

Make sure your Google sign-in button redirects to your backend:

```typescript
// In your signin page
const handleGoogleSignIn = () => {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  window.location.href = `${backendUrl}/api/auth/google`;
};
```

## 🔄 How It Works Now

1. **User clicks "Sign in with Google"**
2. **Redirects to Google OAuth**
3. **Google redirects to your backend** (`/api/auth/google/callback`)
4. **Backend creates/updates user and generates JWT**
5. **Backend redirects to frontend** (`/auth-callback?status=signup&token=eyJ...`)
6. **Frontend stores token and redirects to dashboard/onboarding**

## 🎯 Key Benefits

- ✅ **Secure token storage** in localStorage
- ✅ **Automatic token handling** in API calls
- ✅ **Proper error handling** for expired tokens
- ✅ **User experience** with loading states and redirects
- ✅ **New user onboarding** flow

## 🧪 Testing

1. Deploy your backend to Render
2. Deploy your frontend
3. Update Google OAuth redirect URI
4. Test the full flow!

## 🚨 Troubleshooting

**Token not being stored?**
- Check browser console for errors
- Verify the callback URL is correct
- Ensure frontend can access localStorage

**API calls failing?**
- Check if token is in localStorage
- Verify backend URL is correct
- Check backend logs for authentication errors

**Redirect loops?**
- Ensure auth-callback page exists
- Check router.push() calls
- Verify authentication state management
