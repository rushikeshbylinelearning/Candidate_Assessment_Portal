import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Send, AlertTriangle, CheckCircle2, Bookmark, BookmarkCheck, LayoutDashboard } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   CSS VARIABLES & GLOBAL STYLES
   All colors, spacing, and radius values are driven by CSS custom properties.
   Dark mode is handled via prefers-color-scheme media query at the bottom.
───────────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  /* ── Google Fonts ── */
  /* DM Sans for UI labels, Sora for question text */

  /* ── Design Tokens ── */
  :root {
    /* Primary palette */
    --ar-navy:        #0F172A;
    --ar-navy-mid:    #1E293B;
    --ar-navy-soft:   #334155;
    --ar-blue:        #3B82F6;
    --ar-blue-hover:  #2563EB;
    --ar-blue-tint:   #EFF6FF;
    --ar-blue-border: #BFDBFE;
    --ar-white:       #FFFFFF;
    --ar-bg:          #F8FAFC;
    --ar-border:      #E2E8F0;
    --ar-border-mid:  #CBD5E1;

    /* Semantic */
    --ar-green:       #16A34A;
    --ar-green-bg:    #F0FDF4;
    --ar-green-bdr:   #BBF7D0;
    --ar-amber:       #D97706;
    --ar-amber-bg:    #FFFBEB;
    --ar-amber-bdr:   #FDE68A;
    --ar-red:         #DC2626;
    --ar-red-bg:      #FEF2F2;
    --ar-red-bdr:     #FECACA;

    /* Typography */
    --ar-font-ui:     'DM Sans', 'Inter', system-ui, sans-serif;
    --ar-font-q:      'Sora', 'DM Sans', system-ui, sans-serif;

    /* Radius */
    --ar-r-sm:  6px;
    --ar-r:     8px;
    --ar-r-md:  12px;
    --ar-r-lg:  16px;

    /* Shadows */
    --ar-shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
    --ar-shadow-hover: 0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
    --ar-shadow-modal: 0 24px 48px rgba(0,0,0,0.18), 0 8px 16px rgba(0,0,0,0.10);

    /* Layout */
    --ar-sidebar-w: 240px;
    --ar-topbar-h:  64px;
  }

  /* ── Dark mode overrides ── */
  @media (prefers-color-scheme: dark) {
    :root {
      --ar-white:       #1E293B;
      --ar-bg:          #0F172A;
      --ar-border:      #334155;
      --ar-border-mid:  #475569;
      --ar-navy:        #F8FAFC;
      --ar-navy-mid:    #E2E8F0;
      --ar-navy-soft:   #CBD5E1;
      --ar-blue-tint:   rgba(59,130,246,0.12);
      --ar-blue-border: rgba(59,130,246,0.3);
      --ar-green-bg:    rgba(22,163,74,0.12);
      --ar-green-bdr:   rgba(22,163,74,0.3);
      --ar-amber-bg:    rgba(217,119,6,0.12);
      --ar-amber-bdr:   rgba(217,119,6,0.3);
      --ar-red-bg:      rgba(220,38,38,0.12);
      --ar-red-bdr:     rgba(220,38,38,0.3);
      --ar-shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2);
      --ar-shadow-hover: 0 4px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2);
      --ar-shadow-modal: 0 24px 48px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3);
    }
  }

  /* ── Keyframes ── */
  @keyframes ar-spin    { to { transform: rotate(360deg); } }
  @keyframes ar-fadeIn  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes ar-slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes ar-pulse   { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }
  @keyframes ar-ring-pulse { 0%,100% { filter: drop-shadow(0 0 0px var(--ar-red)); } 50% { filter: drop-shadow(0 0 6px var(--ar-red)); } }
  @keyframes ar-progress { from { width: 0; } }

  /* ── Base reset for assessment runner ── */
  .ar-root * { box-sizing: border-box; }
  .ar-root { font-family: var(--ar-font-ui); }

  /* ── Topbar ── */
  .ar-topbar {
    position: sticky; top: 0; z-index: 100;
    height: var(--ar-topbar-h);
    background: var(--ar-navy);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; gap: 16px;
    transition: box-shadow 0.2s;
  }
  .ar-topbar.scrolled {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  }
  .ar-brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .ar-brand-icon {
    width: 34px; height: 34px; border-radius: 10px;
    background: var(--ar-blue); display: flex; align-items: center; justify-content: center;
    font-family: var(--ar-font-ui); font-weight: 800; font-size: 16px; color: #fff;
    flex-shrink: 0;
  }
  .ar-brand-title { font-size: 14px; font-weight: 600; color: #fff; line-height: 1.3; }
  .ar-brand-sub   { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 1px; }

  /* ── Timer ring ── */
  .ar-timer-wrap { display: flex; align-items: center; gap: 10px; }
  .ar-timer-ring { flex-shrink: 0; }
  .ar-timer-ring.pulse { animation: ar-ring-pulse 1s ease-in-out infinite; }
  .ar-timer-text {
    font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums;
    color: #fff; letter-spacing: -0.5px;
    font-family: var(--ar-font-ui);
  }
  .ar-timer-label { font-size: 10px; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.06em; }

  /* ── Topbar right ── */
  .ar-topbar-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
  .ar-dashboard-link {
    display: flex; align-items: center; gap: 5px;
    font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.6);
    text-decoration: none; cursor: pointer; background: none; border: none;
    padding: 6px 10px; border-radius: var(--ar-r); transition: all 0.15s;
  }
  .ar-dashboard-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
  .ar-progress-text { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.7); }
  .ar-saving-dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--ar-amber);
    animation: ar-pulse 1.2s ease-in-out infinite;
  }

  /* ── Layout shell ── */
  .ar-shell {
    min-height: calc(100vh - var(--ar-topbar-h));
    background: var(--ar-bg);
    display: flex;
  }

  /* ── Sidebar ── */
  .ar-sidebar {
    width: var(--ar-sidebar-w); flex-shrink: 0;
    background: var(--ar-white);
    border-right: 1px solid var(--ar-border);
    padding: 24px 16px;
    display: flex; flex-direction: column; gap: 20px;
    position: sticky; top: var(--ar-topbar-h);
    height: calc(100vh - var(--ar-topbar-h));
    overflow-y: auto;
  }

  /* ── Question nav bubbles ── */
  .ar-nav-label {
    font-size: 10px; font-weight: 700; color: var(--ar-navy-soft);
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
  }
  .ar-nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .ar-nav-bubble {
    aspect-ratio: 1; border-radius: var(--ar-r-sm); border: 2px solid var(--ar-border);
    background: var(--ar-bg); color: var(--ar-navy-soft);
    font-size: 12px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; position: relative;
    font-family: var(--ar-font-ui);
  }
  .ar-nav-bubble:hover:not(.current) { border-color: var(--ar-blue); color: var(--ar-blue); background: var(--ar-blue-tint); }
  .ar-nav-bubble.answered { background: var(--ar-blue); border-color: var(--ar-blue); color: #fff; }
  .ar-nav-bubble.current  { background: var(--ar-navy); border-color: var(--ar-navy); color: #fff; }
  .ar-nav-bubble.flagged::after {
    content: ''; position: absolute; top: -3px; right: -3px;
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--ar-amber); border: 2px solid var(--ar-white);
  }

  /* ── Sidebar progress ── */
  .ar-sidebar-progress { margin-top: 4px; }
  .ar-sidebar-progress-bar {
    height: 5px; background: var(--ar-border); border-radius: 99px; overflow: hidden; margin: 6px 0;
  }
  .ar-sidebar-progress-fill {
    height: 100%; background: var(--ar-blue); border-radius: 99px; transition: width 0.4s ease;
  }
  .ar-sidebar-progress-text { font-size: 12px; color: var(--ar-navy-soft); }
  .ar-sidebar-progress-count { font-weight: 700; color: var(--ar-navy); }

  /* ── Legend ── */
  .ar-legend { display: flex; flex-direction: column; gap: 5px; }
  .ar-legend-item { display: flex; align-items: center; gap: 7px; font-size: 11px; color: var(--ar-navy-soft); }
  .ar-legend-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }

  /* ── Sidebar submit CTA ── */
  .ar-sidebar-submit {
    width: 100%; padding: 10px; border-radius: var(--ar-r); border: none;
    background: var(--ar-green); color: #fff; font-weight: 700; font-size: 13px;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: background 0.15s; font-family: var(--ar-font-ui);
  }
  .ar-sidebar-submit:hover { background: #15803d; }

  /* ── Main content area ── */
  .ar-main {
    flex: 1; min-width: 0;
    padding: 28px 32px;
    display: flex; flex-direction: column; gap: 20px;
    max-width: 860px;
  }

  /* ── Question card ── */
  .ar-question-card {
    background: var(--ar-white);
    border-radius: var(--ar-r-lg);
    border: 1px solid var(--ar-border);
    padding: 32px;
    box-shadow: var(--ar-shadow-card);
    animation: ar-fadeIn 0.2s ease-out;
  }

  /* ── Badges ── */
  .ar-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 99px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
    font-family: var(--ar-font-ui);
  }
  .ar-badge-category { border: 1.5px solid var(--ar-blue); color: var(--ar-blue); background: var(--ar-blue-tint); }
  .ar-badge-easy     { background: var(--ar-green-bg); color: var(--ar-green); border: 1px solid var(--ar-green-bdr); }
  .ar-badge-medium   { background: var(--ar-amber-bg); color: var(--ar-amber); border: 1px solid var(--ar-amber-bdr); }
  .ar-badge-hard     { background: var(--ar-red-bg);   color: var(--ar-red);   border: 1px solid var(--ar-red-bdr); }
  .ar-badge-points   { background: var(--ar-bg); color: var(--ar-navy-soft); border: 1px solid var(--ar-border); }

  /* ── Question number ── */
  .ar-q-number { font-size: 12px; font-weight: 700; color: var(--ar-blue); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }

  /* ── Question text ── */
  .ar-q-text {
    font-family: var(--ar-font-q);
    font-size: 18px; font-weight: 500; line-height: 1.65;
    color: var(--ar-navy); margin-bottom: 24px;
  }

  /* ── Answer options ── */
  .ar-options { display: flex; flex-direction: column; gap: 10px; }
  .ar-option {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; border-radius: var(--ar-r);
    border: 1.5px solid var(--ar-border);
    background: var(--ar-white); cursor: pointer;
    transition: all 0.15s ease;
    position: relative; overflow: hidden;
    font-family: var(--ar-font-ui);
  }
  .ar-option::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: transparent; transition: background 0.15s;
  }
  .ar-option:hover { background: var(--ar-blue-tint); border-color: var(--ar-blue-border); }
  .ar-option:hover::before { background: var(--ar-blue); }
  .ar-option:active { transform: scale(0.99); }
  .ar-option.selected { background: var(--ar-blue-tint); border-color: var(--ar-blue); }
  .ar-option.selected::before { background: var(--ar-blue); }
  .ar-option:focus-visible { outline: 2px solid var(--ar-blue); outline-offset: 2px; }

  /* ── Radio / Checkbox indicator ── */
  .ar-radio {
    width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid var(--ar-border-mid); background: var(--ar-white);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .ar-radio.checked { border-color: var(--ar-blue); background: var(--ar-blue); }
  .ar-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: #fff; }
  .ar-checkbox {
    width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
    border: 2px solid var(--ar-border-mid); background: var(--ar-white);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .ar-checkbox.checked { border-color: var(--ar-blue); background: var(--ar-blue); }
  .ar-option-text { font-size: 15px; color: var(--ar-navy-mid); line-height: 1.5; flex: 1; }
  .ar-option.selected .ar-option-text { color: var(--ar-navy); font-weight: 500; }

  /* ── Code block ── */
  .ar-code-block {
    background: #0F172A; border-radius: var(--ar-r); padding: 16px 20px;
    font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
    font-size: 13px; color: #E2E8F0; line-height: 1.7;
    overflow-x: auto; margin-bottom: 20px;
    border: 1px solid rgba(255,255,255,0.06);
  }

  /* ── Textarea ── */
  .ar-textarea {
    width: 100%; padding: 14px 16px; border-radius: var(--ar-r);
    border: 1.5px solid var(--ar-border); background: var(--ar-white);
    font-size: 15px; color: var(--ar-navy); line-height: 1.6;
    resize: vertical; outline: none; transition: all 0.15s;
    font-family: var(--ar-font-ui);
    min-height: 120px;
  }
  .ar-textarea::placeholder {
    color: var(--ar-navy-soft); opacity: 0.5;
    font-style: italic;
  }
  .ar-textarea:hover { border-color: var(--ar-border-mid); }
  .ar-textarea:focus { 
    border-color: var(--ar-blue); 
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
    background: var(--ar-white);
  }
  .ar-textarea.code { 
    font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace; 
    font-size: 13px; background: #0F172A; color: #E2E8F0; 
    border-color: rgba(255,255,255,0.1);
    min-height: 200px;
  }
  .ar-textarea.code:focus { border-color: var(--ar-blue); }

  /* ── Answered indicator ── */
  .ar-answered-badge { display: flex; align-items: center; gap: 5px; color: var(--ar-green); font-size: 13px; font-weight: 600; }

  /* ── Action bar ── */
  .ar-action-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 24px; margin-top: 8px;
    border-top: 1px solid var(--ar-border);
    gap: 12px;
  }
  .ar-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; border-radius: var(--ar-r);
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all 0.15s; border: none;
    font-family: var(--ar-font-ui);
  }
  .ar-btn:focus-visible { outline: 2px solid var(--ar-blue); outline-offset: 2px; }
  .ar-btn-ghost {
    background: var(--ar-white); border: 1.5px solid var(--ar-border);
    color: var(--ar-navy-soft);
  }
  .ar-btn-ghost:hover:not(:disabled) { border-color: var(--ar-border-mid); color: var(--ar-navy); background: var(--ar-bg); }
  .ar-btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }
  .ar-btn-primary { background: var(--ar-blue); color: #fff; }
  .ar-btn-primary:hover { background: var(--ar-blue-hover); }
  .ar-btn-success { background: var(--ar-green); color: #fff; }
  .ar-btn-success:hover { background: #15803d; }
  .ar-btn-flag {
    background: var(--ar-white); border: 1.5px solid var(--ar-border);
    color: var(--ar-navy-soft);
  }
  .ar-btn-flag.flagged { border-color: var(--ar-amber-bdr); color: var(--ar-amber); background: var(--ar-amber-bg); }
  .ar-btn-flag:hover:not(.flagged) { border-color: var(--ar-amber-bdr); color: var(--ar-amber); background: var(--ar-amber-bg); }

  /* ── Submit CTA card ── */
  .ar-submit-cta {
    background: var(--ar-white); border-radius: var(--ar-r-md);
    border: 1px solid var(--ar-border); padding: 20px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    box-shadow: var(--ar-shadow-card);
  }
  .ar-submit-cta-text { font-size: 14px; color: var(--ar-navy-soft); line-height: 1.5; }
  .ar-submit-cta-text strong { color: var(--ar-navy); }
  .ar-submit-cta-warn { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ar-amber); font-weight: 500; margin-top: 4px; }

  /* ── Modal overlay ── */
  .ar-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.55);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 24px;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  .ar-modal {
    background: var(--ar-white); border-radius: 20px;
    padding: 36px; max-width: 440px; width: 100%;
    box-shadow: var(--ar-shadow-modal);
    animation: ar-fadeIn 0.2s ease-out;
  }
  .ar-modal-icon {
    width: 56px; height: 56px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }

  /* ── Loading / Error states ── */
  .ar-loader {
    min-height: 100vh; background: var(--ar-bg);
    display: flex; align-items: center; justify-content: center;
  }
  .ar-spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 3px solid var(--ar-border);
    border-top-color: var(--ar-blue);
    animation: ar-spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  /* ── Mobile: horizontal nav pills ── */
  .ar-mobile-nav {
    display: none;
    overflow-x: auto; gap: 6px; padding: 12px 16px;
    background: var(--ar-white); border-bottom: 1px solid var(--ar-border);
    scrollbar-width: none;
  }
  .ar-mobile-nav::-webkit-scrollbar { display: none; }
  .ar-mobile-pill {
    flex-shrink: 0; width: 34px; height: 34px; border-radius: 99px;
    border: 2px solid var(--ar-border); background: var(--ar-bg);
    color: var(--ar-navy-soft); font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; position: relative;
    font-family: var(--ar-font-ui);
  }
  .ar-mobile-pill.answered { background: var(--ar-blue); border-color: var(--ar-blue); color: #fff; }
  .ar-mobile-pill.current  { background: var(--ar-navy); border-color: var(--ar-navy); color: #fff; }
  .ar-mobile-pill.flagged::after {
    content: ''; position: absolute; top: -2px; right: -2px;
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--ar-amber); border: 1.5px solid var(--ar-white);
  }

  /* ── Mobile action bar (fixed bottom) ── */
  .ar-mobile-action-bar {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--ar-white); border-top: 1px solid var(--ar-border);
    padding: 12px 16px; padding-bottom: max(12px, env(safe-area-inset-bottom));
    gap: 8px; z-index: 90;
    box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
  }

  /* ── Responsive breakpoints ── */

  /* Tablet: 640px–1024px */
  @media (max-width: 1024px) {
    .ar-sidebar { display: none; }
    .ar-mobile-nav { display: flex; }
    .ar-main { padding: 20px 24px; max-width: 100%; padding-bottom: 100px; }
    .ar-question-card { padding: 24px; }
    .ar-submit-cta { flex-direction: column; align-items: flex-start; }
    .ar-action-bar { display: none; }
    .ar-mobile-action-bar { display: flex; }
    .ar-topbar { padding: 0 16px; }
    .ar-brand-sub { display: none; }
    .ar-timer-label { display: none; }
  }

  /* Mobile: < 640px */
  @media (max-width: 639px) {
    .ar-topbar { height: auto; min-height: 56px; padding: 10px 14px; flex-wrap: wrap; gap: 8px; }
    .ar-brand-title { font-size: 13px; }
    .ar-timer-text { font-size: 16px; }
    .ar-progress-text { display: none; }
    .ar-main { padding: 14px 14px; padding-bottom: 90px; }
    .ar-question-card { padding: 18px; border-radius: var(--ar-r-md); }
    .ar-q-text { font-size: 16px; }
    .ar-option { padding: 12px 14px; }
    .ar-option-text { font-size: 14px; }
    .ar-textarea { font-size: 14px; padding: 12px 14px; min-height: 100px; }
    .ar-textarea.code { font-size: 12px; min-height: 160px; }
    .ar-submit-cta { padding: 16px; }
    .ar-modal { padding: 24px; border-radius: var(--ar-r-lg); }
    .ar-dashboard-link span { display: none; }
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   TIMER RING COMPONENT
   SVG-based circular countdown ring. Color shifts: green → amber → red.
   Pulses when under 3 minutes.
───────────────────────────────────────────────────────────────────────────── */
function TimerRing({ secondsLeft, totalSeconds }) {
  const SIZE = 44;
  const STROKE = 3.5;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  const ratio = totalSeconds > 0 ? Math.max(0, secondsLeft / totalSeconds) : 1;
  const offset = CIRC * (1 - ratio);

  // Color logic: green → amber (< 10 min) → red (< 3 min)
  const color = secondsLeft < 180
    ? 'var(--ar-red)'
    : secondsLeft < 600
    ? 'var(--ar-amber)'
    : 'var(--ar-blue)';

  const isPulsing = secondsLeft < 180;

  const fmt = (s) => {
    if (s === null || s === undefined) return '--:--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="ar-timer-wrap" role="timer" aria-label={`Time remaining: ${fmt(secondsLeft)}`}>
      {/* SVG ring */}
      <svg
        className={`ar-timer-ring${isPulsing ? ' pulse' : ''}`}
        width={SIZE} height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <div>
        <div className="ar-timer-text" style={{ color }}>{fmt(secondsLeft)}</div>
        <div className="ar-timer-label">remaining</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUESTION NAV COMPONENT
   Renders numbered bubbles with answered/current/flagged states.
───────────────────────────────────────────────────────────────────────────── */
function QuestionNav({ questions, current, answers, flagged, onGoto, isAnswered, variant = 'sidebar' }) {
  if (variant === 'mobile') {
    return (
      <nav className="ar-mobile-nav" aria-label="Question navigation">
        {questions.map((q, i) => {
          const done = isAnswered(q._id);
          const isCurrent = i === current;
          const isFlagged = flagged.has(q._id);
          let cls = 'ar-mobile-pill';
          if (isCurrent) cls += ' current';
          else if (done) cls += ' answered';
          if (isFlagged) cls += ' flagged';
          return (
            <button
              key={q._id}
              className={cls}
              onClick={() => onGoto(i)}
              aria-label={`Question ${i + 1}${done ? ', answered' : ''}${isFlagged ? ', flagged' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>
    );
  }

  // Sidebar variant
  return (
    <aside className="ar-sidebar" aria-label="Assessment navigation">
      <div>
        <div className="ar-nav-label">Questions</div>
        <div className="ar-nav-grid" role="group" aria-label="Question navigation">
          {questions.map((q, i) => {
            const done = isAnswered(q._id);
            const isCurrent = i === current;
            const isFlagged = flagged.has(q._id);
            let cls = 'ar-nav-bubble';
            if (isCurrent) cls += ' current';
            else if (done) cls += ' answered';
            if (isFlagged) cls += ' flagged';
            return (
              <button
                key={q._id}
                className={cls}
                onClick={() => onGoto(i)}
                title={`Q${i + 1} — ${q.category || ''}`}
                aria-label={`Question ${i + 1}${done ? ', answered' : ''}${isFlagged ? ', flagged' : ''}`}
                aria-current={isCurrent ? 'true' : undefined}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="ar-legend" aria-hidden="true">
        <div className="ar-legend-item">
          <div className="ar-legend-dot" style={{ background: 'var(--ar-navy)', border: '2px solid var(--ar-navy)' }} />
          Current
        </div>
        <div className="ar-legend-item">
          <div className="ar-legend-dot" style={{ background: 'var(--ar-blue)' }} />
          Answered
        </div>
        <div className="ar-legend-item">
          <div className="ar-legend-dot" style={{ background: 'var(--ar-bg)', border: '2px solid var(--ar-border)' }} />
          Unanswered
        </div>
        <div className="ar-legend-item">
          <div className="ar-legend-dot" style={{ background: 'var(--ar-amber)', borderRadius: '50%' }} />
          Flagged
        </div>
      </div>

      {/* Progress */}
      <div className="ar-sidebar-progress">
        <div className="ar-nav-label">Progress</div>
        <div className="ar-sidebar-progress-bar" role="progressbar" aria-valuenow={Object.keys(answers).length} aria-valuemax={questions.length}>
          <div
            className="ar-sidebar-progress-fill"
            style={{ width: `${Math.round((Object.keys(answers).filter(id => {
              const a = answers[id];
              return a !== null && a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
            }).length / questions.length) * 100)}%` }}
          />
        </div>
        <div className="ar-sidebar-progress-text">
          <span className="ar-sidebar-progress-count">
            {Object.keys(answers).filter(id => {
              const a = answers[id];
              return a !== null && a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
            }).length}
          </span>
          /{questions.length} answered
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUESTION CARD COMPONENT
   Renders the question text, badges, and answer options.
   Supports: mcq_single, true_false, mcq_multi, short_answer, scenario, coding.
───────────────────────────────────────────────────────────────────────────── */
function QuestionCard({ question, answer, onChange, questionIndex, totalQuestions, flagged, onToggleFlag, isAnswered }) {
  const { type, options } = question;

  const difficultyClass = {
    easy: 'ar-badge-easy',
    medium: 'ar-badge-medium',
    hard: 'ar-badge-hard',
  }[question.difficulty?.toLowerCase()] || 'ar-badge-medium';

  const renderOptions = () => {
    if (type === 'mcq_single' || type === 'true_false') {
      return (
        <div className="ar-options" role="radiogroup" aria-labelledby="ar-question-text">
          {(options || []).map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.id || opt.value;
            const label = typeof opt === 'string' ? opt : opt.text || opt.label || opt.value;
            const selected = answer === val;
            return (
              <div
                key={val}
                className={`ar-option${selected ? ' selected' : ''}`}
                onClick={() => onChange(val)}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(val)}
              >
                <div className={`ar-radio${selected ? ' checked' : ''}`} aria-hidden="true">
                  {selected && <div className="ar-radio-dot" />}
                </div>
                <span className="ar-option-text">{label}</span>
              </div>
            );
          })}
        </div>
      );
    }

    if (type === 'mcq_multi') {
      const selected = Array.isArray(answer) ? answer : [];
      const toggle = (val) => {
        const next = selected.includes(val)
          ? selected.filter(x => x !== val)
          : [...selected, val];
        onChange(next);
      };
      return (
        <div>
          <p style={{ fontSize: 12, color: 'var(--ar-navy-soft)', marginBottom: 12, fontWeight: 500 }}>
            Select all that apply
          </p>
          <div className="ar-options" role="group" aria-labelledby="ar-question-text">
            {(options || []).map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.id || opt.value;
              const label = typeof opt === 'string' ? opt : opt.text || opt.label || opt.value;
              const isSelected = selected.includes(val);
              return (
                <div
                  key={val}
                  className={`ar-option${isSelected ? ' selected' : ''}`}
                  onClick={() => toggle(val)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(val)}
                >
                  <div className={`ar-checkbox${isSelected ? ' checked' : ''}`} aria-hidden="true">
                    {isSelected && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="ar-option-text">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (type === 'short_answer' || type === 'scenario' || type === 'logic' || type === 'coding') {
      const isCoding = type === 'coding';
      return (
        <textarea
          className={`ar-textarea${isCoding ? ' code' : ''}`}
          value={answer || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={
            isCoding
              ? '// Write your code here...'
              : type === 'scenario'
              ? 'Describe your approach to this scenario...'
              : 'Write your answer here...'
          }
          rows={isCoding ? 12 : 6}
          aria-label="Answer input"
        />
      );
    }

    return <p style={{ color: 'var(--ar-navy-soft)', fontSize: 14 }}>Unsupported question type: {type}</p>;
  };

  return (
    <div className="ar-question-card">
      {/* Header row: badges + answered indicator */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
          {question.category && (
            <span className="ar-badge ar-badge-category">{question.category}</span>
          )}
          {question.difficulty && (
            <span className={`ar-badge ${difficultyClass}`} style={{ textTransform: 'capitalize' }}>
              {question.difficulty}
            </span>
          )}
          {question.points && (
            <span className="ar-badge ar-badge-points">{question.points} pt{question.points !== 1 ? 's' : ''}</span>
          )}
        </div>
        {isAnswered && (
          <div className="ar-answered-badge">
            <CheckCircle2 size={15} aria-hidden="true" />
            Answered
          </div>
        )}
      </div>

      {/* Question number */}
      <div className="ar-q-number">Question {questionIndex + 1} of {totalQuestions}</div>

      {/* Question text */}
      <p className="ar-q-text" id="ar-question-text">{question.text}</p>

      {/* Answer options */}
      {renderOptions()}

      {/* Action bar (desktop only — hidden on mobile via CSS) */}
      <div className="ar-action-bar">
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Prev button */}
          <button
            className="ar-btn ar-btn-ghost"
            onClick={() => {}} // handled by parent via prop
            data-action="prev"
            aria-label="Previous question"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </button>
        </div>

        {/* Flag for review */}
        <button
          className={`ar-btn ar-btn-flag${flagged ? ' flagged' : ''}`}
          onClick={onToggleFlag}
          aria-label={flagged ? 'Remove flag' : 'Flag for review'}
          aria-pressed={flagged}
        >
          {flagged
            ? <><BookmarkCheck size={15} aria-hidden="true" /> Flagged</>
            : <><Bookmark size={15} aria-hidden="true" /> Flag for Review</>
          }
        </button>

        {/* Next / Submit */}
        <div data-action="next-submit" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TIMER HOOK
   Manages countdown state and fires onExpire when time runs out.
───────────────────────────────────────────────────────────────────────────── */
function useTimer(onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef(null);

  const start = useCallback((remaining, total) => {
    setSecondsLeft(remaining);
    setTotalSeconds(total || remaining);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onExpire]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { secondsLeft, totalSeconds, start };
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN ASSESSMENT RUNNER
   Orchestrates session loading, answer tracking, auto-save, navigation,
   flagging, and submission.
───────────────────────────────────────────────────────────────────────────── */
export default function AssessmentRunner() {
  const { token } = useParams();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [flagged, setFlagged] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const questionStartRef = useRef(Date.now());
  const saveQueueRef = useRef({});
  const saveTimerRef = useRef(null);
  const tabSwitchCount = useRef(0);

  // ── Scroll detection for topbar blur ──────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Tab-switch detection ───────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        if (tabSwitchCount.current <= 3) {
          toast('Please stay on this tab during the assessment', { icon: '⚠️', duration: 4000 });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const handleExpire = useCallback(() => {
    toast('Time is up! Submitting your assessment...', { icon: '⏰', duration: 3000 });
    setTimeout(() => doSubmit(true), 2000);
  }, []);

  const { secondsLeft, totalSeconds, start } = useTimer(handleExpire);

  // ── Load session ───────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`/api/tokens/session/${token}`)
      .then(r => {
        const data = r.data;
        setSession(data);

        // Restore existing answers
        const restored = {};
        (data.existingResponses || []).forEach(resp => {
          restored[resp.questionId] = resp.answer;
        });
        setAnswers(restored);

        // Calculate remaining time
        const elapsed = data.existingResponses?.length > 0
          ? data.existingResponses.reduce((sum, r) => sum + (r.timeSpent || 0), 0)
          : 0;
        const totalSecs = data.assessment.duration * 60;
        const remaining = Math.max(totalSecs - elapsed, 30);
        start(remaining, totalSecs);
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Failed to load assessment';
        if (err.response?.status === 409) {
          navigate(`/assessment/${token}/complete`);
        } else {
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const flushSave = useCallback(async (qId, ans) => {
    if (!session) return;
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);
    setSaving(true);
    try {
      await axios.post('/api/tokens/answer', {
        tokenValue: token,
        questionId: qId,
        answer: ans,
        timeSpent,
      });
    } catch {
      // silent — will retry on next change
    } finally {
      setSaving(false);
    }
  }, [token, session]);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    clearTimeout(saveTimerRef.current);
    saveQueueRef.current[questionId] = value;
    saveTimerRef.current = setTimeout(() => {
      flushSave(questionId, value);
    }, 800);
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = (index) => {
    if (!session) return;
    const q = session.questions[current];
    if (q && answers[q._id] !== undefined) {
      flushSave(q._id, answers[q._id]);
    }
    questionStartRef.current = Date.now();
    setCurrent(index);
    // Scroll to top of main content on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Flag toggle ────────────────────────────────────────────────────────────
  const toggleFlag = (questionId) => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
        toast('Flag removed', { icon: '🔖', duration: 1500 });
      } else {
        next.add(questionId);
        toast('Flagged for review', { icon: '🔖', duration: 1500 });
      }
      return next;
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const doSubmit = async (forced = false) => {
    setSubmitting(true);
    // Flush any pending saves first
    const pending = Object.entries(saveQueueRef.current);
    for (const [qId, ans] of pending) {
      await flushSave(qId, ans).catch(() => {});
    }
    try {
      await axios.post('/api/tokens/submit', { tokenValue: token });
      navigate(`/assessment/${token}/complete`);
    } catch (err) {
      if (err.response?.status === 409) {
        navigate(`/assessment/${token}/complete`);
      } else {
        toast.error('Submission failed. Please try again.');
        setSubmitting(false);
        setShowConfirm(false);
      }
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isAnswered = (id) => {
    const a = answers[id];
    return a !== null && a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="ar-root ar-loader">
      <style>{GLOBAL_CSS}</style>
      <div style={{ textAlign: 'center', color: 'var(--ar-navy-soft)' }}>
        <div className="ar-spinner" />
        <p style={{ fontSize: 14, fontFamily: 'var(--ar-font-ui)' }}>Restoring your session...</p>
      </div>
    </div>
  );

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) return (
    <div className="ar-root ar-loader">
      <style>{GLOBAL_CSS}</style>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
        <AlertTriangle size={48} color="var(--ar-red)" style={{ margin: '0 auto 16px', display: 'block' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ar-navy)', marginBottom: 8, fontFamily: 'var(--ar-font-ui)' }}>
          Session Error
        </h2>
        <p style={{ color: 'var(--ar-navy-soft)', fontSize: 14 }}>{error}</p>
      </div>
    </div>
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const questions = session.questions;
  const q = questions[current];
  const totalQ = questions.length;
  const answered = Object.keys(answers).filter(id => isAnswered(id)).length;
  const unanswered = totalQ - answered;
  const allAnswered = answered === totalQ;
  const isLastQuestion = current === totalQ - 1;
  const isFirstQuestion = current === 0;
  const canGoBack = !isFirstQuestion && (session.assessment.allowBacktrack !== false);
  const isFlagged = flagged.has(q._id);

  /* ── RENDER ─────────────────────────────────────────────────────────────── */
  return (
    <div className="ar-root" style={{ minHeight: '100vh', background: 'var(--ar-bg)' }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <header className={`ar-topbar${scrolled ? ' scrolled' : ''}`} role="banner">
        {/* Brand */}
        <div className="ar-brand">
          <div className="ar-brand-icon" aria-hidden="true">H</div>
          <div>
            <div className="ar-brand-title">{session.assessment.title}</div>
            {session.role?.title && (
              <div className="ar-brand-sub">{session.role.title}</div>
            )}
          </div>
        </div>

        {/* Timer ring — centered */}
        <TimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />

        {/* Right controls */}
        <div className="ar-topbar-right">
          {saving && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} aria-live="polite" aria-label="Saving...">
              <div className="ar-saving-dot" />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Saving</span>
            </div>
          )}
          <span className="ar-progress-text" aria-label={`Question ${current + 1} of ${totalQ}`}>
            {current + 1} of {totalQ}
          </span>
          <button className="ar-dashboard-link" onClick={() => navigate('/')} aria-label="Back to dashboard">
            <LayoutDashboard size={14} aria-hidden="true" />
            <span>Dashboard</span>
          </button>
        </div>
      </header>

      {/* ── MOBILE QUESTION NAV (horizontal pills) ──────────────────────── */}
      <QuestionNav
        questions={questions}
        current={current}
        answers={answers}
        flagged={flagged}
        onGoto={goTo}
        isAnswered={isAnswered}
        variant="mobile"
      />

      {/* ── MAIN SHELL ──────────────────────────────────────────────────── */}
      <div className="ar-shell">

        {/* ── SIDEBAR (desktop) ─────────────────────────────────────────── */}
        <QuestionNav
          questions={questions}
          current={current}
          answers={answers}
          flagged={flagged}
          onGoto={goTo}
          isAnswered={isAnswered}
          variant="sidebar"
        />

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <main className="ar-main" role="main">

          {/* Question card */}
          <section aria-label={`Question ${current + 1}`}>
            {/* Badges + question text + options */}
            <div className="ar-question-card">
              {/* Header: badges + answered */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                  {q.category && (
                    <span className="ar-badge ar-badge-category">{q.category}</span>
                  )}
                  {q.difficulty && (
                    <span className={`ar-badge ar-badge-${ q.difficulty?.toLowerCase() === 'easy' ? 'easy' : q.difficulty?.toLowerCase() === 'hard' ? 'hard' : 'medium' }`} style={{ textTransform: 'capitalize' }}>
                      {q.difficulty}
                    </span>
                  )}
                  {q.points && (
                    <span className="ar-badge ar-badge-points">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                  )}
                </div>
                {isAnswered(q._id) && (
                  <div className="ar-answered-badge" aria-label="This question is answered">
                    <CheckCircle2 size={15} aria-hidden="true" />
                    Answered
                  </div>
                )}
              </div>

              {/* Question number */}
              <div className="ar-q-number" aria-hidden="true">
                Question {current + 1} of {totalQ}
              </div>

              {/* Question text */}
              <p className="ar-q-text" id="ar-question-text">{q.text}</p>

              {/* Answer options */}
              {/* Show textarea for text-based question types.
                  NOTE: PDF-imported descriptive questions are stored as type='short_answer'.
                  Also treat questions with no options as descriptive regardless of type. */}
              {(q.type === 'short_answer' || q.type === 'scenario' || q.type === 'logic' || q.type === 'coding' || q.type === 'descriptive' || q.type === 'text' || q.type === 'essay' || (!q.options || q.options.length === 0)) ? (
                <div>
                  <textarea
                    className={`ar-textarea${q.type === 'coding' ? ' code' : ''}`}
                    value={answers[q._id] || ''}
                    onChange={e => handleAnswer(q._id, e.target.value)}
                    placeholder={
                      q.type === 'coding'
                        ? '// Write your code here...'
                        : q.type === 'scenario'
                        ? 'Describe your approach to this scenario...'
                        : q.type === 'logic'
                        ? 'Explain your reasoning...'
                        : q.type === 'essay'
                        ? 'Write your detailed response here...'
                        : 'Any suggestions, comments, or feedback regarding the interview process, interviewer approach, or overall candidate'
                    }
                    rows={q.type === 'coding' ? 12 : q.type === 'essay' ? 8 : 6}
                    aria-label="Answer input"
                    aria-labelledby="ar-question-text"
                  />
                  {/* Character count */}
                  {answers[q._id] && (
                    <div style={{ 
                      fontSize: 12, 
                      color: 'var(--ar-navy-soft)', 
                      marginTop: 6, 
                      textAlign: 'right' 
                    }}>
                      {(answers[q._id] || '').length} characters
                    </div>
                  )}
                </div>
              ) : q.type === 'mcq_multi' && q.options && q.options.length > 0 ? (() => {
                const sel = Array.isArray(answers[q._id]) ? answers[q._id] : [];
                const toggle = (val) => {
                  const next = sel.includes(val) ? sel.filter(x => x !== val) : [...sel, val];
                  handleAnswer(q._id, next);
                };
                return (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--ar-navy-soft)', marginBottom: 12, fontWeight: 500 }}>
                      Select all that apply
                    </p>
                    <div className="ar-options" role="group" aria-labelledby="ar-question-text">
                      {(q.options || []).map((opt) => {
                        const val = typeof opt === 'string' ? opt : opt.id || opt.value;
                        const label = typeof opt === 'string' ? opt : opt.text || opt.label || opt.value;
                        const isSelected = sel.includes(val);
                        return (
                          <div
                            key={val}
                            className={`ar-option${isSelected ? ' selected' : ''}`}
                            onClick={() => toggle(val)}
                            role="checkbox"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(val)}
                          >
                            <div className={`ar-checkbox${isSelected ? ' checked' : ''}`} aria-hidden="true">
                              {isSelected && (
                                <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
                                  <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <span className="ar-option-text">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })() : (q.type === 'mcq_single' || q.type === 'true_false') && q.options && q.options.length > 0 ? (
                <div className="ar-options" role="radiogroup" aria-labelledby="ar-question-text">
                  {(q.options || []).map((opt) => {
                    const val = typeof opt === 'string' ? opt : opt.id || opt.value;
                    const label = typeof opt === 'string' ? opt : opt.text || opt.label || opt.value;
                    const selected = answers[q._id] === val;
                    return (
                      <div
                        key={val}
                        className={`ar-option${selected ? ' selected' : ''}`}
                        onClick={() => handleAnswer(q._id, val)}
                        role="radio"
                        aria-checked={selected}
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAnswer(q._id, val)}
                      >
                        <div className={`ar-radio${selected ? ' checked' : ''}`} aria-hidden="true">
                          {selected && <div className="ar-radio-dot" />}
                        </div>
                        <span className="ar-option-text">{label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <textarea
                    className="ar-textarea"
                    value={answers[q._id] || ''}
                    onChange={e => handleAnswer(q._id, e.target.value)}
                    placeholder="Write your answer here..."
                    rows={6}
                    aria-label="Answer input"
                    aria-labelledby="ar-question-text"
                  />
                  {answers[q._id] && (
                    <div style={{ 
                      fontSize: 12, 
                      color: 'var(--ar-navy-soft)', 
                      marginTop: 6, 
                      textAlign: 'right' 
                    }}>
                      {(answers[q._id] || '').length} characters
                    </div>
                  )}
                </div>
              )}

              {/* ── Desktop action bar ─────────────────────────────────── */}
              <div className="ar-action-bar">
                {/* Previous */}
                <button
                  className="ar-btn ar-btn-ghost"
                  onClick={() => goTo(current - 1)}
                  disabled={!canGoBack}
                  aria-label="Previous question"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Previous
                </button>

                {/* Flag for review */}
                <button
                  className={`ar-btn ar-btn-flag${isFlagged ? ' flagged' : ''}`}
                  onClick={() => toggleFlag(q._id)}
                  aria-label={isFlagged ? 'Remove flag from this question' : 'Flag this question for review'}
                  aria-pressed={isFlagged}
                >
                  {isFlagged
                    ? <><BookmarkCheck size={15} aria-hidden="true" /> Flagged</>
                    : <><Bookmark size={15} aria-hidden="true" /> Flag for Review</>
                  }
                </button>

                {/* Next / Submit */}
                {isLastQuestion ? (
                  <button
                    className="ar-btn ar-btn-success"
                    onClick={() => setShowConfirm(true)}
                    aria-label="Submit assessment"
                  >
                    <Send size={15} aria-hidden="true" />
                    Submit Assessment
                  </button>
                ) : (
                  <button
                    className="ar-btn ar-btn-primary"
                    onClick={() => goTo(current + 1)}
                    aria-label="Next question"
                  >
                    Next
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── Submit CTA card ──────────────────────────────────────────── */}
          <div className="ar-submit-cta" role="complementary" aria-label="Submission status">
            <div>
              <div className="ar-submit-cta-text">
                You've answered <strong>{answered}/{totalQ}</strong> questions.{' '}
                {allAnswered
                  ? 'Ready to submit!'
                  : `${unanswered} question${unanswered > 1 ? 's' : ''} remaining.`
                }
              </div>
              {!allAnswered && (
                <div className="ar-submit-cta-warn" role="alert" aria-live="polite">
                  <AlertTriangle size={13} aria-hidden="true" />
                  Unanswered questions will be marked incorrect
                </div>
              )}
            </div>
            <button
              className="ar-btn ar-btn-success"
              onClick={() => setShowConfirm(true)}
              style={{ flexShrink: 0, opacity: allAnswered ? 1 : 0.65 }}
              aria-label={allAnswered ? 'Finish and submit assessment' : `Submit with ${unanswered} unanswered`}
            >
              <Send size={15} aria-hidden="true" />
              {allAnswered ? 'Finish & Submit' : `Submit (${unanswered} left)`}
            </button>
          </div>

        </main>
      </div>

      {/* ── MOBILE FIXED ACTION BAR ──────────────────────────────────────── */}
      <div className="ar-mobile-action-bar" role="navigation" aria-label="Question navigation controls">
        <button
          className="ar-btn ar-btn-ghost"
          onClick={() => goTo(current - 1)}
          disabled={!canGoBack}
          style={{ flex: 1, justifyContent: 'center' }}
          aria-label="Previous question"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Prev
        </button>

        <button
          className={`ar-btn ar-btn-flag${isFlagged ? ' flagged' : ''}`}
          onClick={() => toggleFlag(q._id)}
          style={{ flexShrink: 0 }}
          aria-label={isFlagged ? 'Remove flag' : 'Flag for review'}
          aria-pressed={isFlagged}
        >
          {isFlagged
            ? <BookmarkCheck size={15} aria-hidden="true" />
            : <Bookmark size={15} aria-hidden="true" />
          }
        </button>

        {isLastQuestion ? (
          <button
            className="ar-btn ar-btn-success"
            onClick={() => setShowConfirm(true)}
            style={{ flex: 1, justifyContent: 'center' }}
            aria-label="Submit assessment"
          >
            <Send size={14} aria-hidden="true" />
            Submit
          </button>
        ) : (
          <button
            className="ar-btn ar-btn-primary"
            onClick={() => goTo(current + 1)}
            style={{ flex: 1, justifyContent: 'center' }}
            aria-label="Next question"
          >
            Next
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── CONFIRM SUBMIT MODAL ─────────────────────────────────────────── */}
      {showConfirm && (
        <div
          className="ar-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ar-modal-title"
          aria-describedby="ar-modal-desc"
          onClick={(e) => e.target === e.currentTarget && !submitting && setShowConfirm(false)}
        >
          <div className="ar-modal">
            {/* Icon */}
            <div
              className="ar-modal-icon"
              style={{ background: allAnswered ? 'var(--ar-green-bg)' : 'var(--ar-amber-bg)' }}
              aria-hidden="true"
            >
              <Send size={24} color={allAnswered ? 'var(--ar-green)' : 'var(--ar-amber)'} />
            </div>

            {/* Title */}
            <h2
              id="ar-modal-title"
              style={{ fontSize: 20, fontWeight: 700, color: 'var(--ar-navy)', textAlign: 'center', marginBottom: 10, fontFamily: 'var(--ar-font-ui)' }}
            >
              Submit Assessment?
            </h2>

            {/* Description */}
            <p
              id="ar-modal-desc"
              style={{ color: 'var(--ar-navy-soft)', fontSize: 14, lineHeight: 1.65, textAlign: 'center', marginBottom: 8 }}
            >
              You've answered <strong style={{ color: 'var(--ar-navy)' }}>{answered}</strong> of{' '}
              <strong style={{ color: 'var(--ar-navy)' }}>{totalQ}</strong> questions.
            </p>

            {/* Unanswered warning */}
            {!allAnswered && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 'var(--ar-r)', marginBottom: 16,
                  background: 'var(--ar-amber-bg)', border: '1px solid var(--ar-amber-bdr)',
                  fontSize: 13, color: 'var(--ar-amber)', fontWeight: 500,
                }}
                role="alert"
              >
                <AlertTriangle size={14} aria-hidden="true" />
                {unanswered} question{unanswered > 1 ? 's' : ''} unanswered — will be marked incorrect
              </div>
            )}

            <p style={{ color: 'var(--ar-navy-soft)', fontSize: 12, textAlign: 'center', marginBottom: 24 }}>
              This action cannot be undone.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="ar-btn ar-btn-ghost"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Review Answers
              </button>
              <button
                className="ar-btn ar-btn-success"
                onClick={() => doSubmit(false)}
                disabled={submitting}
                style={{ flex: 1, justifyContent: 'center', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}