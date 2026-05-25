import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowRight, ShieldCheck, User } from 'lucide-react';

// ─── Theme tokens ──────────────────────────────────────────────────────────
const T = {
  red:        '#E53935',
  redHover:   '#C62828',
  redPress:   '#B71C1C',
  redSoft:    'rgba(229,57,53,0.08)',
  redGlow:    'rgba(229,57,53,0.25)',
  redGlowHov: 'rgba(229,57,53,0.4)',
  black:      '#0D0D0D',
  gray1:      '#3D3D3D',
  gray2:      '#6B6B6B',
  gray3:      '#B0B0B0',
  gray4:      '#E0E0E0',
  gray5:      '#F5F5F5',
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

    const blobs = [
      { x: W * 0.12, y: H * 0.18, r: 380, color: 'rgba(229,57,53,',  base: 0.10, speed: 0.0008, phase: 0 },
      { x: W * 0.88, y: H * 0.78, r: 280, color: 'rgba(229,57,53,',  base: 0.07, speed: 0.0006, phase: 2 },
      { x: W * 0.65, y: H * 0.12, r: 220, color: 'rgba(13,13,13,',   base: 0.04, speed: 0.001,  phase: 1 },
      { x: W * 0.08, y: H * 0.82, r: 200, color: 'rgba(183,28,28,',  base: 0.06, speed: 0.0007, phase: 3 },
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

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function AccessPage() {
  const [digits, setDigits]           = useState(['', '', '', '', '', '']);
  const [loading, setLoading]         = useState(false);
  const [btnHovered, setBtnHovered]   = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputRefs = useRef([]);
  const navigate  = useNavigate();

  const accessCode = digits.join('');
  const isReady    = accessCode.length === 6 && !loading;

  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const nd = [...digits]; nd[index] = ''; setDigits(nd);
      } else if (index > 0) inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft'  && index > 0) inputRefs.current[index - 1]?.focus();
      else if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const nd = ['', '', '', '', '', ''];
      pasted.split('').forEach((ch, i) => { nd[i] = ch; });
      setDigits(nd);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isReady) return;
    setLoading(true);
    try {
      const { data } = await axios.post('/api/tokens/access-code', { accessCode });
      navigate(`/pipeline/${data.token}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid access code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
        @keyframes cardIn      { from { opacity:0; transform:translateY(28px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes spin        { to { transform: rotate(360deg) } }
        @keyframes badgePulse  { 0%,100% { box-shadow:0 0 0 0 rgba(229,57,53,0.5) } 60% { box-shadow:0 0 0 7px rgba(229,57,53,0) } }
        @keyframes dotShimmer  { 0%,100% { opacity:0.4 } 50% { opacity:0.9 } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        input::placeholder { color: #C8C8C8 !important; }
        ::-webkit-scrollbar { width:0 }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #FAFAFA 55%, #F5F5F5 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', overflow: 'hidden',
      }}>
        <AnimatedBackground />

        {/* Admin button — top right */}
        <button
          onClick={() => navigate('/login')}
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
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = T.red;
            e.currentTarget.style.color = T.red;
            e.currentTarget.style.boxShadow = `0 2px 8px ${T.redGlow}`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = T.gray4;
            e.currentTarget.style.color = T.gray1;
            e.currentTarget.style.boxShadow = '0 1px 4px rgba(13,13,13,0.1)';
          }}
        >
          <User size={14} />
          <span>Login as Admin</span>
        </button>

        {/* Main content */}
        <div style={{
          width: '100%', maxWidth: 480,
          position: 'relative', zIndex: 10,
          animation: 'cardIn 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}>

          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              {/* Shield icon box */}
              <div style={{
                width: 76, height: 76, borderRadius: 22,
                background: T.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(13,13,13,0.12), 0 2px 8px rgba(13,13,13,0.08)',
                border: `1px solid ${T.gray4}`,
                position: 'relative',
              }}>
                <ShieldCheck size={36} color={T.red} strokeWidth={1.8} />
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

              {/* Decorative dots — red + black only */}
              {[T.red, T.black, T.redHover, T.gray3].map((color, i) => {
                const angles = [315, 45, 135, 225];
                const rad = (angles[i] * Math.PI) / 180;
                const r = 52;
                return (
                  <div key={i} style={{
                    position: 'absolute',
                    width: 8, height: 8, borderRadius: '50%',
                    background: color, opacity: 0.6,
                    left: `calc(50% + ${Math.cos(rad) * r}px - 4px)`,
                    top:  `calc(50% + ${Math.sin(rad) * r}px - 4px)`,
                    animation: `dotShimmer ${2 + i * 0.5}s ease-in-out infinite`,
                  }} />
                );
              })}
            </div>

            <h1 style={{
              fontSize: 32, fontWeight: 800, color: T.black,
              letterSpacing: '-0.8px', margin: 0, lineHeight: 1.15,
            }}>
              Assessment Portal
            </h1>
            <p style={{ color: T.gray2, marginTop: 8, fontSize: 15, fontWeight: 400, margin: '8px 0 0' }}>
              Enter your 6-digit access code to begin
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${T.gray4}`,
            borderRadius: 20,
            padding: '36px 36px 32px',
            boxShadow: '0 8px 40px rgba(13,13,13,0.1), 0 2px 12px rgba(13,13,13,0.06)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Red top border */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: `linear-gradient(90deg, ${T.redPress} 0%, ${T.red} 50%, ${T.redHover} 100%)`,
              borderRadius: '20px 20px 0 0',
            }} />

            <form onSubmit={handleSubmit}>
              <label style={{
                display: 'block',
                fontSize: 12, fontWeight: 600, color: T.gray2,
                marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em',
                textAlign: 'center',
              }}>
                Access Code
              </label>

              {/* 6 digit boxes */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                {digits.map((digit, index) => {
                  const isFocused = focusedIndex === index;
                  const isFilled  = digit !== '';
                  return (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit} autoFocus={index === 0}
                      onChange={e => handleDigitChange(index, e.target.value)}
                      onKeyDown={e => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      style={{
                        width: 60, height: 70,
                        textAlign: 'center',
                        fontSize: 28, fontWeight: 800,
                        color: isFilled ? T.black : T.gray4,
                        border: `2.5px solid ${isFocused ? T.red : isFilled ? T.redHover : T.gray4}`,
                        borderRadius: 14,
                        background: isFocused ? T.redSoft : isFilled ? 'rgba(229,57,53,0.04)' : '#FAFAFA',
                        outline: 'none',
                        boxShadow: isFocused
                          ? `0 0 0 4px ${T.redGlow}, 0 2px 8px ${T.redGlow}`
                          : isFilled
                          ? `0 0 0 3px rgba(229,57,53,0.12)`
                          : '0 1px 3px rgba(13,13,13,0.08)',
                        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                        cursor: 'text',
                        caretColor: T.red,
                        fontFamily: "'Inter', monospace",
                      }}
                    />
                  );
                })}
              </div>

              {/* Progress bar — red segments */}
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 28 }}>
                {digits.map((digit, i) => (
                  <div key={i} style={{
                    height: 6, flex: 1, borderRadius: 3,
                    background: digit !== ''
                      ? i < 3 ? T.red : T.redHover
                      : T.gray4,
                    boxShadow: digit !== ''
                      ? `0 0 6px ${T.redGlow}`
                      : 'none',
                    transition: 'background 0.25s ease, box-shadow 0.25s ease',
                  }} />
                ))}
              </div>

              {/* CTA button */}
              <button
                type="submit"
                disabled={!isReady}
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                style={{
                  width: '100%', padding: '15px',
                  borderRadius: 12, border: 'none',
                  background: isReady ? (btnHovered ? T.redHover : T.red) : T.gray5,
                  color: isReady ? '#fff' : T.gray3,
                  fontWeight: 600, fontSize: 15,
                  cursor: isReady ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  boxShadow: isReady
                    ? btnHovered ? `0 6px 24px ${T.redGlowHov}` : `0 4px 16px ${T.redGlow}`
                    : 'none',
                  transform: isReady && btnHovered ? 'translateY(-1px)' : 'translateY(0)',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  letterSpacing: '0.01em',
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2.5px solid rgba(255,255,255,0.35)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                    <span>Validating…</span>
                  </>
                ) : (
                  <>
                    <span>Access Assessment</span>
                    <ArrowRight
                      size={18}
                      style={{
                        transition: 'transform 0.2s',
                        transform: btnHovered && isReady ? 'translateX(4px)' : 'translateX(0)',
                      }}
                    />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 20px' }}>
              <div style={{ flex: 1, height: 1, background: T.gray4 }} />
              <span style={{ fontSize: 12, color: T.gray3, fontWeight: 500 }}>Need help?</span>
              <div style={{ flex: 1, height: 1, background: T.gray4 }} />
            </div>

            {/* Help text */}
            <div style={{
              padding: '14px 16px',
              background: T.gray5,
              borderRadius: 12,
              border: `1px solid ${T.gray4}`,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: T.redSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
              }}>
                <span style={{ fontSize: 14 }}>💬</span>
              </div>
              <p style={{ fontSize: 13, color: T.gray2, margin: 0, lineHeight: 1.65 }}>
                Your access code was shared by HR. Contact your recruiter if you haven't received it.
              </p>
            </div>
          </div>

          {/* Footer trust badges */}
          <div style={{
            textAlign: 'center', marginTop: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {[
              { label: 'Secure',       color: T.red   },
              { label: 'Timed',        color: T.black },
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
