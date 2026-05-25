import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Award, Target, ShieldCheck } from 'lucide-react';

const BAND_CONFIG = {
  excellent:    { color: '#16a34a', bg: '#f0fdf4', label: 'Excellent',       icon: '🏆' },
  strong:       { color: '#2563eb', bg: '#eff6ff', label: 'Strong',          icon: '⭐' },
  moderate:     { color: '#d97706', bg: '#fffbeb', label: 'Moderate',        icon: '📊' },
  needs_review: { color: '#7c3aed', bg: '#faf5ff', label: 'Needs Review',    icon: '📝' },
  reject:       { color: '#e11d48', bg: '#fef2f2', label: 'Below Threshold', icon: '📉' },
};

export default function CompletionPage() {
  const { token } = useParams();
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const { data } = await axios.get(`/api/tokens/result/${token}`);
        setScore(data);
      } catch {
        // Score may still be processing
      } finally {
        setLoading(false);
      }
    };

    fetchScore();
    const retry = setTimeout(fetchScore, 2500);
    return () => clearTimeout(retry);
  }, [token]);

  const band = score ? (BAND_CONFIG[score.performanceBand] || BAND_CONFIG.moderate) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4',
            border: '3px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: '0 0 0 8px #f0fdf440',
          }}>
            <CheckCircle size={40} color="#16a34a" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Assessment Submitted!</h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
            Your responses have been recorded and are being reviewed.
          </p>
        </div>

        {loading ? (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Calculating your score...</p>
          </div>
        ) : score ? (
          <>
            {/* Score card */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Your Score
                </div>
                <div style={{ fontSize: 72, fontWeight: 900, color: band?.color || '#0f172a', lineHeight: 1 }}>
                  {score.finalScore}
                </div>
                <div style={{ fontSize: 18, color: '#94a3b8', marginBottom: 12 }}>/100</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 18px',
                  borderRadius: 20, background: band?.bg, color: band?.color,
                  fontWeight: 700, fontSize: 14,
                }}>
                  {band?.icon} {band?.label}
                </div>
              </div>

              {/* Section scores */}
              {score.sectionScores && Object.keys(score.sectionScores).length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Section Breakdown
                  </div>
                  {Object.entries(score.sectionScores).map(([cat, val]) => (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 14, color: '#334155', textTransform: 'capitalize', fontWeight: 500 }}>{cat}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: val >= 70 ? '#16a34a' : val >= 50 ? '#d97706' : '#e11d48' }}>{val}%</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          width: `${val}%`,
                          background: val >= 70 ? '#16a34a' : val >= 50 ? '#d97706' : '#e11d48',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                [Target,      'Accuracy',   `${score.accuracyPercentage}%`, '#2563eb'],
                [CheckCircle, 'Completion', `${score.completionRate}%`,     '#16a34a'],
                [Award,       'Result',     score.resultStatus?.toUpperCase(), score.resultStatus === 'pass' ? '#16a34a' : '#e11d48'],
              ].map(([Icon, label, value, color]) => (
                <div key={label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <Icon size={20} color={color} style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, textAlign: 'center', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Award size={40} color="#94a3b8" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Your score will be available once the HR team reviews your submission.</p>
          </div>
        )}

        {/* What's next */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>What happens next?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Your responses have been securely saved and submitted.', '#16a34a'],
              ['The HR team will review your assessment results.',        '#2563eb'],
              ['You will be contacted via email regarding next steps.',   '#7c3aed'],
            ].map(([text, color], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, paddingTop: 3 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
          <ShieldCheck size={14} />
          Your data is secure and confidential
        </div>
      </div>
    </div>
  );
}
