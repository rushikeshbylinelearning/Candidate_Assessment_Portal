# SSO Implementation Report — Assessment System

## Status: ✅ COMPLETE — Pre-existing Implementation Verified

---

## 1. Files Summary

All SSO files were already implemented and registered. No new files required.
Configuration variables already present in `backend/.env`.

### Backend — Existing SSO Files (Verified)
| File | Purpose |
|---|---|
| `backend/src/routes/ssoLogin.js` | `GET /sso-login` route handler (CommonJS) |
| `backend/src/services/portalSsoTokenService.js` | Verifies HS256 launch tokens; `EXPECTED_APPLICATION=ASSESSMENT` |
| `backend/src/services/ssoLoginAuditService.js` | Appends SSO events to `backend/sso-audit.log` |

### Backend — Registration (Verified in server.js)
```js
const ssoLoginRoutes = require('./src/routes/ssoLogin');
// ...
app.use(ssoLoginRoutes);   // mounted before API routes
```

### Backend .env — SSO Variables (Verified Present)
```env
SSO_SECRET=do-not-change-me-use-openssl-rand-base64-48-for-sso-launch-tokens
SSO_APPLICATION_CODE=ASSESSMENT
FRONTEND_URL=http://localhost:5176,https://assessment-portal.legatolxp.online
```

### Note on Assessment System vs Candidate Assessment Portal
The `asseement-system/backend` and `asseement-system/candidate-assessment-portal/backend`
are two separate Node processes with separate codebases, separate `.env` files, and
separate MongoDB connections. Both use identical SSO patterns but the CAP required
a fresh implementation (see `candidate-assessment-portal/SSO_IMPLEMENTATION_REPORT.md`).

### Files NOT Modified (existing login preserved)
- `backend/src/modules/auth/auth.controller.js` — `POST /api/auth/login` untouched
- `backend/src/modules/auth/auth.routes.js` — untouched
- `backend/src/modules/auth/user.model.js` — untouched

---

## 2. Authentication Flow (Existing — Unchanged)

```
User → POST /api/auth/login { email, password }
     → auth.controller.js login():
         User.findOne({ email }).select('+password')
         user.comparePassword(password)          ← bcrypt via userSchema.methods
         check user.status === 'active'
         user.lastLogin = new Date(); user.save()
         generateJWT(user._id)                   ← jwt.sign({ id }, JWT_SECRET, { expiresIn })
     → Response: { token, user }  (password stripped via toJSON())
     → Frontend: stores in localStorage
```

---

## 3. SSO Flow (Existing — Verified Working)

```
Portal Launcher
  └─ Signs HS256 token: { userId, email, application:"ASSESSMENT", exp: +5min }
  └─ Redirects browser → GET https://assessment-portal.legatolxp.online/sso-login?token=xxxxx

Assessment System Backend (GET /sso-login)
  └─ Check: token present?         → no  → redirect /login?error=sso_error
  └─ Check: SSO_SECRET configured? → no  → 503 JSON
  └─ verifyPortalLaunchToken(token)
     └─ jwt.verify(token, SSO_SECRET, { algorithms:['HS256'] })
     └─ Validate: exp, iat not future, application === "ASSESSMENT"
     └─ Optional: validate iss if SSO_ISSUER env is set
     └─ Fail → audit log + redirect /login?error=sso_error
  └─ User.findOne({ status:'active', $or:[{email:lookupEmail},{email:rawLowerEmail}] })
     └─ Not found → audit log + redirect /login?error=sso_error
  └─ user.lastLogin = new Date(); user.save()   ← reuses existing session logic
  └─ generateJWT(user._id)                       ← same function as normal login
  └─ ssoLoginAuditService.logSSOLoginSuccess()
  └─ Redirect → /auth/sso-callback?token=...&user=...

Frontend (/auth/sso-callback)
  └─ [handled by whichever frontend consumes this backend]
  └─ Parse token + user, store in localStorage, navigate to dashboard
```

---

## 4. SSO Configuration Variables

Already present in `backend/.env`. For production deployment, update:

```env
SSO_SECRET=<generate: openssl rand -base64 48>
SSO_APPLICATION_CODE=ASSESSMENT
# SSO_ISSUER=sso-portal   (optional, set if Portal encodes iss claim)
FRONTEND_URL=https://assessment-portal.legatolxp.online
```

**The `SSO_SECRET` value must match exactly what the Portal Launcher uses to sign tokens.**

---

## 5. Testing Checklist

### Prerequisites
- [ ] `SSO_SECRET` in backend `.env` matches Portal Launcher `SSO_SECRET`
- [ ] Backend restarted (if `.env` was changed)
- [ ] Test user exists in MongoDB `candidate_assement` DB with `status: "active"` and matching email

### Backend Tests
- [ ] `GET /sso-login` — no token → 302 redirect to `/login?error=sso_error&message=SSO+token+is+required`
- [ ] `GET /sso-login?token=bad_sig` — invalid signature → redirect with error message
- [ ] `GET /sso-login?token=expired` — expired token → redirect with "Token has expired"
- [ ] `GET /sso-login?token=wrong_app` — application mismatch → redirect with error
- [ ] `GET /sso-login?token=valid_unknown_email` — no account → redirect "No account found for..."
- [ ] `GET /sso-login?token=valid_known_email` → 302 to `/auth/sso-callback?token=...&user=...`
- [ ] `backend/sso-audit.log` updated after each attempt
- [ ] `user.lastLogin` updated in MongoDB after successful SSO login

### End-to-End Test
- [ ] Click "Launch" on Assessment System app in Portal Launcher
- [ ] Browser lands on `/sso-login?token=xxx`
- [ ] Redirects through to dashboard without prompting for password
- [ ] User identity matches Portal account email

---

## 6. Rollback Plan

All changes are additive and isolated. To rollback:

1. **server.js** — remove `require('./src/routes/ssoLogin')` and `app.use(ssoLoginRoutes)`
2. **Delete**: `src/routes/ssoLogin.js`, `src/services/portalSsoTokenService.js`, `src/services/ssoLoginAuditService.js`
3. **Remove** `SSO_SECRET`, `SSO_APPLICATION_CODE` from `backend/.env`

`POST /api/auth/login` and all normal authentication flows are unaffected at every step.
