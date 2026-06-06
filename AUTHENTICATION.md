# Authentication and Authorization

This document explains how ArtisanNest authenticates users, keeps them signed in,
and controls what each user role can access.

## Overview

The application uses a custom email-and-password authentication system built
with:

- Prisma and MySQL for user records
- Zod for server-side input validation
- bcrypt for password hashing and comparison
- `jose` for signed JSON Web Tokens (JWTs)
- Next.js cookies for session storage
- Next.js Proxy, server-side data access helpers, Server Actions, and Route
  Handlers for authorization

Authentication answers "Who is this user?" Session management keeps that answer
available across requests. Authorization decides what the authenticated user may
do.

## User Roles

The `User` model supports four roles:

| Role | How the account is created | Main access |
| --- | --- | --- |
| `CUSTOMER` | Public registration followed by email verification | Store, cart, wishlist, checkout, orders, profile, and customer transactions |
| `SELLER` | Public registration followed by email verification | Seller dashboard, products, inventory, orders, shop, and earnings |
| `ADMIN` | Database seed or super-admin-created sub-admin | Admin dashboard and administration features |
| `SUPER_ADMIN` | Created through trusted database/administrative setup | All admin access plus sub-admin management |

Public registration accepts only `CUSTOMER` and `SELLER`. A user cannot register
as an admin from the public form.

## Customer Registration

The registration form submits to the `register` Server Action in
`src/app/actions/auth.ts`.

1. Zod validates the name, email, password, and selected role.
2. The email must not already exist in the `User` table.
3. The password must contain at least eight characters, one uppercase letter,
   and one number.
4. bcrypt hashes the password with cost factor 12. The plain-text password is
   never stored.
5. A customer is created with `role: CUSTOMER` and `isVerified: false`.
6. The application emails a one-hour verification link to the customer.
7. The customer cannot log in until the link is verified.
8. Successful verification marks the account as verified, creates a session,
   and redirects the customer to the storefront.

The customer welcome email is sent after successful verification.

## Seller Registration and Email Verification

Seller registration uses the same validation, password-hashing, and email
verification process as customer registration.

1. The application creates a cryptographically random 32-byte verification
   token.
2. The token is stored in `VerificationToken` and expires after one hour.
3. A verification link is emailed to the seller.
4. The seller cannot log in while `isVerified` is false.
5. The verification page calls `GET /api/auth/verify-email?token=...`.
6. The Route Handler checks that the token exists and has not expired.
7. It marks the seller as verified, deletes the one-time token, creates a
   session, and automatically logs the seller in.

Requesting another verification email deletes previous tokens for that email
and creates a new one-hour token.

## Login for All Roles

Customers, sellers, admins, and super admins use the same login Server Action.

1. Zod validates the submitted email and password.
2. Prisma looks up the user by the unique email address.
3. bcrypt compares the submitted password with the stored hash.
4. A dummy bcrypt comparison also runs when the email does not exist. This
   reduces timing differences that could reveal registered email addresses.
5. Invalid credentials return the same `Invalid email or password` message.
6. An unverified customer or seller is refused and directed to email
   verification.
7. A valid user receives a signed session cookie.

After authentication, users are redirected by role:

| Role | Destination |
| --- | --- |
| `CUSTOMER` | `/` |
| `SELLER` | `/seller/dashboard` |
| `ADMIN` or `SUPER_ADMIN` | `/admin/dashboard` |

Login attempts are rate-limited to 10 attempts per IP address per 15 minutes.
The Proxy also applies broader limits to authentication pages and API requests.

## Session Creation and Validation

`src/lib/session.ts` creates a stateless session:

1. `src/lib/jwt.ts` signs a JWT with the `SESSION_SECRET` environment variable.
2. The token contains `userId`, `role`, and `expiresAt`.
3. The JWT also has a seven-day expiration enforced by `jose`.
4. The token is stored in a cookie named `session`.

Cookie protections are:

- `httpOnly: true`, so browser JavaScript cannot read the cookie
- `secure: true` in production, so it is sent only over HTTPS
- `sameSite: lax`, which provides basic cross-site request protection
- `path: /`, so it is available throughout the application

Every request that needs authentication reads the cookie and verifies the JWT
signature and expiration. A missing, modified, or expired token produces no
valid session.

This is a stateless JWT session. The database does not contain a session record,
and the user record is not reloaded whenever the token is verified.

## Authorization Layers

The application deliberately checks authorization in more than one place.

### 1. Next.js Proxy

`src/proxy.ts` performs fast, optimistic route checks before rendering:

- `/admin/*` requires `ADMIN` or `SUPER_ADMIN`.
- `/seller/*` requires `SELLER`.
- Customer pages such as `/checkout`, `/cart`, `/orders`, `/wishlist`, and
  `/profile` require `CUSTOMER`.
- Selected protected APIs require a valid session.
- Checkout and Stripe APIs require the customer role.
- Authenticated users visiting login or registration are redirected to the
  appropriate area for their role.

Proxy improves navigation and blocks obvious unauthorized requests early, but
it is not the only security boundary.

### 2. Data Access Layer

`src/lib/dal.ts` provides reusable server-only guards:

- `verifySession()` requires any authenticated user.
- `getOptionalSession()` returns a session or `null`.
- `requireCustomer()` requires `CUSTOMER`.
- `requireSeller()` requires `SELLER`.
- `requireAdmin()` requires `ADMIN` or `SUPER_ADMIN`.

Protected pages and layouts call these functions before reading private data.

### 3. Server Actions and Route Handlers

Mutations and APIs check the session again because client-side UI and Proxy
checks alone are not sufficient. Depending on the endpoint, they return:

- `401 Unauthorized` when there is no valid session
- `403 Forbidden` when the user is signed in but has the wrong role
- A redirect for unauthorized page access

### 4. Record Ownership

Role checks do not automatically grant access to every record. Endpoints also
compare the session's `userId` with resource ownership. Examples include:

- Customers may access only their own orders, transactions, wishlist, cart, and
  custom orders.
- Sellers may update only products, variants, inventory, and order items that
  belong to them.
- Chat and notification queries are scoped to the authenticated user.
- Only a `SUPER_ADMIN` may create, update, or delete sub-admin accounts.

These ownership checks prevent one authenticated user from accessing another
user's records by changing an ID in a URL or request body.

## Logout

The `logout` Server Action deletes the `session` cookie and redirects the user
to `/auth/login`. Once the cookie is removed, subsequent protected requests
have no authenticated session.

## Password and Email Changes

Sensitive profile changes use one-time passwords:

- The user must already have a valid session.
- A six-digit OTP is generated and its bcrypt hash is stored in the database.
- The OTP expires after 15 minutes and can be used only once.
- OTP requests are limited to three per user and IP address every 10 minutes.
- Password changes apply the same password-strength rules and bcrypt cost factor
  12 used during registration.
- Email changes send the OTP to the proposed new address and recheck email
  uniqueness before committing the update.

Changing a password or email does not currently invalidate existing JWT
sessions.

## Required Environment Configuration

Authentication requires at least:

```env
DATABASE_URL=...
SESSION_SECRET=...
```

Email verification and OTP delivery also require the mail settings consumed by
`src/lib/email.ts` and `src/lib/email-otp.ts`. `SESSION_SECRET` must be a long,
random value and must never be committed to source control.

## Important Current Behavior

The following points describe the implementation as it currently exists:

- Customer and seller login checks `isVerified`, but seller login does not check
  the seller's `isApproved` field.
- The JWT role is trusted until the token expires. Changing a user's role,
  deleting the user, changing the password, or changing approval status does
  not immediately revoke an already issued session.
- The session cookie itself has no explicit browser `expires` or `maxAge`
  option, so the browser may treat it as a session cookie even though the JWT
  remains valid for seven days.
- `lastLoginAt` exists in the database schema but the login flow does not
  currently update it.
- The in-memory rate limiters are local to each application process and reset
  when that process restarts. They are not a shared distributed rate limiter.
- Sub-admin permissions are stored in the database, but general admin route
  access is primarily authorized by the `ADMIN` role. Each permission-sensitive
  operation must enforce its specific permission separately.

## Main Authentication Files

| File | Responsibility |
| --- | --- |
| `src/app/actions/auth.ts` | Registration, login, logout, and resending verification |
| `src/app/api/auth/verify-email/route.ts` | Customer/seller email-token verification and automatic login |
| `src/lib/validations.ts` | Authentication and password validation rules |
| `src/lib/jwt.ts` | JWT signing and verification |
| `src/lib/session.ts` | Session-cookie creation, reading, and deletion |
| `src/lib/dal.ts` | Server-side session and role guards |
| `src/proxy.ts` | Optimistic route protection, rate limiting, and security headers |
| `src/app/actions/profile.ts` | OTP-protected password and email changes |
| `prisma/schema.prisma` | User, role, verification-token, and OTP data models |
