# SSO Implementation Report — Candidate Assessment Portal

## Status: ✅ COMPLETE — New Implementation

---

## 1. Files Modified

### Backend — New Files Created
| File | Purpose |
|---|---|
| `backend/src/services/portalSsoTokenService.js` | Verifies HS256 launch tokens from the Portal Identity Provider |
| `backend/src/services/ssoLoginAuditService.js` | Appends SSO login events to `sso-audit.log` |
| `backend/src/routes/ssoLogin.js` | `GET /sso-login` route handler |

### Backend — Modified Files
| File | Change |
|---|---|
| `backend/server.js` | Added `require('./src/routes/ssoLogin')` import and `app.use(ssoLoginRoutes)` before API routes |
| `backend/.env` | Added `SSO_SECRET`, `SSO_APPLICATION_CODE=ASSESSMENT`, `FRONTEND_URL` |

### Frontend — New Files Created
| File | Purpose |
|---|---|
| `frontend/src/pages/hr/SsoCallback.jsx` | Receives `?token=&user=` redirect, stores session, navigates to `/hr/dashboard` |

### Frontend — Modified Files
| File | Change |
|---|---|
| `frontend/src/context/AuthContext.jsx` | Added `loginWithToken(token, user)` method; exposed via context |
| `frontend/src/App.jsx` | Added `<Route path="/auth/sso-callback" element={<SsoCallback />} />` (outside HRLayout) |

### Files NOT Modified (existing login preserved)
- `backend/src/modules/auth/auth.controller.js` — untouched
- `backend/src/modules/auth/auth.routes.js` — untouched
- `backend/src/modules/auth/user.model.js` — untouched
- `frontend/src/pages/hr/Login.jsx` — untouched

---

## 2. Authentication Flow (Existing — Unchanged)

```
User → POST /api/auth/login { email, password }
     → auth.controller.js: findOne by email, comparePassword, check status=active
     → generateJWT(user._id)  [JWT_SECRET, JWT_EXPIRES_IN=7d]
     → Response: { token, user }
     → Frontend: stores cap_token + cap_user in localStorage
```

---

## 3. SSO Flow (New — Additive)

```
Portal Launcher
  └─ Signs HS256 token: { userId, email, application:"ASSESSMENT", exp: +5min }
  └─ Redirects browser → GET https://assessment-portal.legatolxp.online/sso-login?token=xxxxx

CAP Backend (GET /sso-login)
  └─ Check: token present?         → no  → redirect /login?error=sso_error
  └─ Check: SSO_SECRET configured? → no  → 503 JSON
  └─ verifyPortalLaunchToken(token)
     └─ jwt.verify(token, SSO_SECRET, { algorithms:['HS256'] })
     └─ Validate: exp, iat not future, application === "ASSESSMENT"
     └─ Fail → audit log + redirect /login?error=sso_error
  └─ User.findOne({ status:'active', email: decoded.appEmail || decoded.email })
     └─ Not found → audit log + redirect /login?error=sso_error
  └─ user.lastLogin = new Date(); user.save()  ← reuses existing session logic
  └─ generateJWT(user._id)                      ← same function as normal login
  └─ logSSOLoginSuccess()
  └─ Redirect → /auth/sso-callback?token=...&user=...

CAP Frontend (/auth/sso-callback)
  └─ SsoCallback.jsx: parse token + user
  └─ loginWithToken(token, user) → localStorage cap_token + cap_user
  └─ navigate('/hr/dashboard', { replace: true })
```

---

## 4. SSO Configuration Variables

Add to `backend/.env` (already added in this implementation):

```env
# ─── Portal SSO Integration ───────────────────────────────────────────────────
SSO_SECRET=<same-value-as-portal-launcher-SSO_SECRET>
SSO_APPLICATION_CODE=ASSESSMENT
# Optional — enable if Portal sets iss claim:
# SSO_ISSUER=sso-portal
FRONTEND_URL=https://assessment-portal.legatolxp.online
```

**The `SSO_SECRET` value must match exactly what the Portal Launcher uses to sign tokens.**

---

## 5. Testing Checklist

### Prerequisites
- [ ] `SSO_SECRET` in CAP `.env` matches Portal Launcher `SSO_SECRET`
- [ ] CAP backend restarted after `.env` change
- [ ] Test user exists in MongoDB with `status: "active"` and same email as Portal account

### Backend Tests
- [ ] `GET /sso-login` — no token → redirects to `/login?error=sso_error`
- [ ] `GET /sso-login?token=bad` — invalid signature → redirects to `/login?error=sso_error`
- [ ] `GET /sso-login?token=expired` — expired token → redirects to `/login?error=sso_error`
- [ ] `GET /sso-login?token=valid_unknown_email` — no account → redirects to `/login?error=sso_error`
- [ ] `GET /sso-login?token=valid_known_email` → 302 redirect to `/auth/sso-callback?token=...&user=...`
- [ ] `sso-audit.log` written in `backend/` directory after each attempt

### Frontend Tests
- [ ] Navigate to `/auth/sso-callback` with no params → shows error + "Return to login" link
- [ ] Navigate to `/auth/sso-callback?token=T&user=U` → stores in localStorage, redirects to `/hr/dashboard`
- [ ] After SSO login, normal logout clears `cap_token` and `cap_user`
- [ ] Normal email/password login still works unaffected

### End-to-End Test
- [ ] Click "Launch" on CAP app in Portal Launcher
- [ ] Browser lands on `/sso-login?token=xxx`
- [ ] Redirects through to `/hr/dashboard` without prompting for password
- [ ] User identity matches Portal account email

---

## 6. Rollback Plan

All changes are additive. To rollback:

1. **Remove SSO route from server.js** — delete the `require` and `app.use(ssoLoginRoutes)` lines
2. **Delete new files**: `src/routes/ssoLogin.js`, `src/services/portalSsoTokenService.js`, `src/services/ssoLoginAuditService.js`
3. **Revert AuthContext.jsx** — remove `loginWithToken` method and its context entry
4. **Revert App.jsx** — remove the `/auth/sso-callback` route and `SsoCallback` import
5. **Delete** `frontend/src/pages/hr/SsoCallback.jsx`
6. **Remove** SSO vars from `backend/.env`

Existing `/api/auth/login` and all normal authentication flows are unaffected at every step.
