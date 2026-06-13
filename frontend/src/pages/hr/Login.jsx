import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Theme tokens ──────────────────────────────────────────────────────────
const T = {
  red:        '#E53935',
  redHover:   '#C62828',
  redPress:   '#B71C1C',
  redSoft:    'rgba(229,57,53,0.08)',
  redGlow:    'rgba(229,57,53,0.25)',
  redGlowHov: 'rgba(229,57,53,0.4)',
  black:      '#0D0D0D',
  blackSoft:  '#1A1A1A',
  gray1:      '#3D3D3D',   // secondary text
  gray2:      '#6B6B6B',   // muted text
  gray3:      '#B0B0B0',   // placeholder / icons
  gray4:      '#E0E0E0',   // borders
  gray5:      '#F5F5F5',   // card bg tint
  white:      '#FFFFFF',
};

/* ─── Animated Background ─────────────────────────────────────────────────── */
function AnimatedBackground() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: 0, y: 0 });
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    const onMouse  = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouse);

    const COLS = Math.ceil(W / 36) + 1;
    const ROWS = Math.ceil(H / 36) + 1;

    // Red + dark blobs only
    const blobs = [
      { x: W * 0.12, y: H * 0.18, r: 340, color: 'rgba(229,57,53,',  base: 0.10, speed: 0.0008, phase: 0 },
      { x: W * 0.88, y: H * 0.78, r: 260, color: 'rgba(229,57,53,',  base: 0.07, speed: 0.0006, phase: 2 },
      { x: W * 0.65, y: H * 0.12, r: 200, color: 'rgba(13,13,13,',   base: 0.04, speed: 0.001,  phase: 1 },
      { x: W * 0.08, y: H * 0.82, r: 180, color: 'rgba(183,28,28,',  base: 0.06, speed: 0.0007, phase: 3 },
    ];

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 1;
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      blobs.forEach((b, i) => {
        const px = b.x + Math.sin(t * b.speed + b.phase) * 40 + (mx - W / 2) * (0.01 + i * 0.003);
        const py = b.y + Math.cos(t * b.speed + b.phase) * 30 + (my - H / 2) * (0.01 + i * 0.003);
        const op = b.base + Math.sin(t * 0.005 + b.phase) * 0.025;
        const g  = ctx.createRadialGradient(px, py, 0, px, py, b.r);
        g.addColorStop(0,   b.color + op + ')');
        g.addColorStop(0.5, b.color + (op * 0.35) + ')');
        g.addColorStop(1,   b.color + '0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, b.r, 0, Math.PI * 2); ctx.fill();
      });

      // Dot grid — very subtle dark dots on white bg
      const offX = (mx - W / 2) * 0.014;
      const offY = (my - H / 2) * 0.014;
      ctx.fillStyle = 'rgba(13,13,13,0.18)';
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          ctx.beginPath();
          ctx.arc(c * 36 + offX, r * 36 + offY, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

/* ─── Floating Label Input ────────────────────────────────────────────────── */
function FloatingInput({ id, label, type, value, onChange, icon: Icon, rightSlot, error, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div style={{ position: 'relative', marginBottom: error ? 6 : 0 }}>
      {/* Left icon */}
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: focused ? T.red : T.gray3,
        transition: 'color 0.2s', pointerEvents: 'none', zIndex: 2,
        display: 'flex', alignItems: 'center',
      }}>
        <Icon size={17} />
      </div>

      {/* Floating label */}
      <label htmlFor={id} style={{
        position: 'absolute', left: 42, zIndex: 2, pointerEvents: 'none',
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        top: lifted ? 8 : '50%',
        transform: lifted ? 'translateY(0) scale(0.78)' : 'translateY(-50%) scale(1)',
        transformOrigin: 'left center',
        color: focused ? T.red : lifted ? T.gray1 : T.gray3,
        fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
      }}>
        {label}
      </label>

      <input
        id={id} type={type} value={value} autoComplete={autoComplete}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required
        style={{
          width: '100%',
          padding: lifted ? '22px 44px 8px 42px' : '15px 44px 15px 42px',
          borderRadius: 12,
          border: `1.5px solid ${error ? T.red : focused ? T.red : T.gray4}`,
          background: T.white,
          color: T.black,
          fontSize: 14, outline: 'none', boxSizing: 'border-box',
          boxShadow: error
            ? `0 0 0 3px ${T.redSoft}`
            : focused
            ? `0 0 0 3px ${T.redSoft}`
            : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s, padding 0.18s',
        }}
      />

      {rightSlot && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
          {rightSlot}
        </div>
      )}
    </div>
  );
}

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: '2.5px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

/* ─── Login Page ──────────────────────────────────────────────────────────── */
export default function Login() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [btnHovered, setHov]    = useState(false);
  const [btnPressed, setPress]  = useState(false);
  const { login, loading }      = useAuth();
  const navigate                = useNavigate();
  const [searchParams]          = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'sso_error') {
      const message = searchParams.get('message');
      setError(message ? decodeURIComponent(message) : 'SSO sign-in failed. Use your local account or contact an administrator.');
    }
  }, [searchParams]);

  const isValid = form.email.includes('@') && form.password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setError('');
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!', {
        style: { background: T.black, color: '#fff', fontWeight: 600 },
        iconTheme: { primary: T.red, secondary: '#fff' },
      });
      navigate('/hr/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  const btnBg = !isValid || loading ? T.gray4
    : btnPressed ? T.redPress
    : btnHovered ? T.redHover
    : T.red;

  const btnShadow = isValid && !loading
    ? btnHovered ? `0 6px 24px ${T.redGlowHov}` : `0 4px 16px ${T.redGlow}`
    : 'none';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
        @keyframes spin         { to { transform: rotate(360deg) } }
        @keyframes fadeSlideUp  { from { opacity:0; transform:translateY(24px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes headerIn     { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes badgePulse   { 0%,100% { box-shadow:0 0 0 0 rgba(229,57,53,0.5) } 60% { box-shadow:0 0 0 8px rgba(229,57,53,0) } }
        input:-webkit-autofill  { -webkit-box-shadow:0 0 0 100px #fff inset !important; -webkit-text-fill-color:#0D0D0D !important; }
        ::-webkit-scrollbar     { width:0 }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #FAFAFA 55%, #F5F5F5 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', overflow: 'hidden',
      }}>
        <AnimatedBackground />

        {/* Candidate Access — top right ghost button */}
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'fixed', top: 20, right: 24, zIndex: 100,
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 100,
            background: 'rgba(255,255,255,0.92)',
            border: `1.5px solid ${T.gray4}`,
            color: T.gray1, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', backdropFilter: 'blur(8px)',
            boxShadow: '0 1px 4px rgba(13,13,13,0.1)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; e.currentTarget.style.boxShadow = `0 2px 8px ${T.redGlow}`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.gray4; e.currentTarget.style.color = T.gray1; e.currentTarget.style.boxShadow = '0 1px 4px rgba(13,13,13,0.1)'; }}
        >
          <Shield size={14} />
          <span>Candidate Access</span>
        </button>

        {/* Content */}
        <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 10 }}>

          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: 32, animation: 'headerIn 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              {/* Logo box */}
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: T.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(13,13,13,0.12), 0 2px 8px rgba(13,13,13,0.08)',
                border: `1px solid ${T.gray4}`,
              }}>
                <Shield size={34} color={T.red} strokeWidth={1.8} />
              </div>
              {/* Live badge */}
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 20, height: 20, borderRadius: '50%',
                background: T.red, border: `2.5px solid #FAFAFA`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'badgePulse 2.5s ease-in-out infinite',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
              </div>
            </div>

            <h1 style={{ fontSize: 30, fontWeight: 800, color: T.black, letterSpacing: '-0.6px', margin: 0 }}>
              CAP Portal
            </h1>
            <p style={{ color: T.gray2, marginTop: 8, fontSize: 15, fontWeight: 400, margin: '8px 0 0' }}>
              HR & Administrator Access
            </p>
          </div>

          {/* Card */}
          <div
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${T.gray4}`,
              borderRadius: 20,
              padding: '40px 40px 36px',
              boxShadow: '0 8px 40px rgba(13,13,13,0.1), 0 2px 12px rgba(13,13,13,0.06)',
              position: 'relative', overflow: 'hidden',
              animation: 'fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
              transition: 'box-shadow 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 48px rgba(13,13,13,0.13), 0 4px 16px rgba(13,13,13,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 40px rgba(13,13,13,0.1), 0 2px 12px rgba(13,13,13,0.06)'}
          >
            {/* Red top border */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: `linear-gradient(90deg, ${T.redPress} 0%, ${T.red} 50%, ${T.redHover} 100%)`,
              borderRadius: '20px 20px 0 0',
            }} />

            {/* Card title */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.black, letterSpacing: '-0.3px', margin: '0 0 4px' }}>
                Sign in to your account
              </h2>
              <p style={{ fontSize: 13, color: T.gray2, margin: 0 }}>
                Enter your credentials to access the admin dashboard
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{
                background: T.redSoft, border: `1px solid rgba(229,57,53,0.3)`,
                borderRadius: 10, padding: '11px 14px', marginBottom: 20,
                color: T.redPress, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 9,
                animation: 'fadeSlideUp 0.2s ease',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <FloatingInput
                id="login-email" label="Email Address" type="email"
                value={form.email} autoComplete="email"
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                icon={Mail} error={error && !form.email.includes('@')}
              />

              <div>
                <FloatingInput
                  id="login-password" label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password} autoComplete="current-password"
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  icon={Lock} error={error && form.password.length < 6}
                  rightSlot={
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      style={{ background: 'none', border: 'none', color: T.gray3, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = T.gray1}
                      onMouseLeave={e => e.currentTarget.style.color = T.gray3}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  }
                />
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <button type="button"
                    style={{ background: 'none', border: 'none', color: T.red, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = T.redHover}
                    onMouseLeave={e => e.currentTarget.style.color = T.red}
                    onClick={() => toast('Password reset coming soon.', { icon: '🔑' })}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={!isValid || loading}
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => { setHov(false); setPress(false); }}
                onMouseDown={() => setPress(true)}
                onMouseUp={() => setPress(false)}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: 12, border: 'none',
                  background: btnBg,
                  color: isValid && !loading ? '#fff' : T.gray3,
                  fontWeight: 600, fontSize: 15,
                  cursor: isValid && !loading ? 'pointer' : 'not-allowed',
                  marginTop: 4, boxShadow: btnShadow,
                  transform: btnPressed && isValid ? 'scale(0.985) translateY(1px)' : btnHovered && isValid ? 'translateY(-1px)' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                }}
                aria-label="Sign in"
              >
                {loading ? (
                  <><Spinner /><span>Signing in…</span></>
                ) : (
                  <>
                    <span>Sign in to Admin</span>
                    <ArrowRight size={17} style={{ transition: 'transform 0.2s', transform: btnHovered && isValid ? 'translateX(3px)' : 'none' }} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 20px' }}>
              <div style={{ flex: 1, height: 1, background: T.gray4 }} />
              <span style={{ fontSize: 11, color: T.gray3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Demo Access</span>
              <div style={{ flex: 1, height: 1, background: T.gray4 }} />
            </div>

            {/* Demo credentials */}
            <div style={{ padding: '14px 16px', background: T.gray5, borderRadius: 12, border: `1px solid ${T.gray4}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { role: 'Admin', email: 'admin@byline.com', pass: 'admin@2026' },
                { role: 'HR',    email: 'hr@cap.com',    pass: 'Hr@12345'  },
              ].map(({ role, email, pass }) => (
                <button
                  key={role} type="button"
                  onClick={() => setForm({ email, password: pass })}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8, transition: 'background 0.15s', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,13,13,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  title={`Fill ${role} credentials`}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: T.redSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={14} color={T.red} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.black }}>{role}</div>
                    <div style={{ fontSize: 11, color: T.gray3, fontFamily: 'monospace' }}>{email} · {pass}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 11, color: T.gray3 }}>click to fill</div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {[
              { label: 'Secure',       color: T.red   },
              { label: 'Admin Access', color: T.black },
              { label: 'Confidential', color: T.red   },
            ].map(({ label, color }, i) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.gray4, display: 'inline-block' }} />}
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.gray3, fontWeight: 500 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', opacity: 0.85 }} />
                  {label}
                </span>
              </span>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
