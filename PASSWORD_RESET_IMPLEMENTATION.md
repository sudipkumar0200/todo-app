# Password Reset Implementation

## Overview
Password reset functionality has been successfully implemented following the existing project patterns.

## Backend Changes

### 1. Database Schema (`backend/prisma/schema.prisma`)
Added two new fields to the User model:
- `resetToken` (String?, nullable) - Stores the unique reset token
- `resetTokenExpiry` (DateTime?, nullable) - Token expiration timestamp (1 hour validity)

**Migration applied**: `20260301025901_add_password_reset_fields`

### 2. Validation (`backend/src/validation/authValidation.ts`)
Added two new Zod schemas:
- `forgotPasswordSchema` - Validates email input
- `resetPasswordSchema` - Validates token and new password (min 6 chars)

### 3. Email Utility (`backend/src/utils/email.ts`)
Added `sendPasswordResetEmail()` function:
- Sends styled HTML email with reset link
- Link format: `http://localhost:5173/reset-password?token={token}`
- Token expires in 1 hour

### 4. Auth Controller (`backend/src/controllers/auth.controller.ts`)
Added two new controller functions:

**`forgotPassword()`**:
- Accepts email address
- Generates secure random token (32 bytes)
- Sets token expiry to 1 hour
- Sends reset email
- Returns generic message (security best practice)

**`resetPassword()`**:
- Validates token and expiry
- Hashes new password
- Updates user password
- Clears reset token fields
- Sets `isPasswordReset` to false

### 5. Routes (`backend/src/routes/auth.router.ts`)
Added two new public endpoints:
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

## Frontend Changes

### 1. New Pages

**`client/src/pages/ForgotPassword.tsx`**:
- Email input form
- Calls `/api/auth/forgot-password`
- Shows confirmation message
- Link back to login

**`client/src/pages/ResetPassword.tsx`**:
- Reads token from URL query parameter
- New password + confirm password fields
- Validates password match and length
- Calls `/api/auth/reset-password`
- Redirects to login on success

### 2. Routing (`client/src/App.tsx`)
Added routes:
- `/forgot-password` - Forgot password page
- `/reset-password` - Reset password page (with token query param)

### 3. Login Page (`client/src/pages/Login.tsx`)
Added "Forgot password?" link next to password field

## API Endpoints

### Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "If the email exists, a reset link has been sent"
}
```

### Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "newPassword": "newpassword123"
}

Response: 200 OK
{
  "message": "Password reset successfully"
}

Response: 400 Bad Request
{
  "message": "Invalid or expired reset token"
}
```

## Security Features

1. **Generic responses** - Forgot password always returns same message (prevents email enumeration)
2. **Token expiry** - Reset tokens expire after 1 hour
3. **Secure tokens** - Uses crypto.randomBytes(32) for token generation
4. **Password hashing** - Uses existing bcrypt implementation
5. **One-time use** - Token is cleared after successful reset

## Testing the Feature

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd client && npm run dev`
3. Navigate to login page
4. Click "Forgot password?"
5. Enter email address
6. Check email for reset link
7. Click link or copy token
8. Enter new password
9. Login with new password

## Environment Variables Required

Ensure these are set in `backend/.env`:
```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SENDER_EMAIL=noreply@yourdomain.com
```

## Notes

- Email sending uses existing nodemailer configuration
- Frontend URL in email is hardcoded to `http://localhost:5173` (update for production)
- Token is 64 characters (32 bytes hex encoded)
- Password requirements: minimum 6 characters
- Reset link expires in 1 hour
