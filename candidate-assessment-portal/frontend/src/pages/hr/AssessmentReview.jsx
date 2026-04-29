import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, CheckCircle, XCircle, Clock, MessageSquare, Code, Lightbulb, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_LABEL = {
  mcq_single: 'MCQ',
  mcq_multi:  'Multi-select',
  true_false: 'True / False',
  short_answer: 'Short Answer',
  scenario:   'Scenario',
  logic:      'Logic',
  coding:     'Coding',
};

const CAT_COLOR = {
  aptitude:      { bg: '#eff6ff', color: '#2563eb' },
  technical:     { bg: '#faf5ff', color: '#7c3aed' },
  reasoning:     { bg: '#f0fdf4', color: '#16a34a' },
  communication: { bg: '#fff7ed', color: '#ea580c' },
};

function QuestionCard({ response, index, onScoreUpdate }) {
  const q = response.questionId;
  const isManual = !response.isAutoScored;
  const hasAnswer = response.answer !== null && response.answer !== undefined && response.answer !== '';
  const catStyle = CAT_COLOR[q?.category] || { bg: '#f1f5f9', color: '#475569' };
  const [manualScore, setManualScore] = useState(response.scoreAwarded ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveScore = async () => {
    const pts = parseFloat(manualScore);
    const max = q?.points || 1;
    if (isNaN(pts) || pts < 0 || pts > max) {
      toast.error(`Score must be between 0 and ${max}`);
      return;
    }
    setSaving(true);
    try {
      await api.put(`/responses/${response._id}/manual-score`, { scoreAwarded: pts });
      setSaved(true);
      onScoreUpdate();
      toast.success('Score saved');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Failed to save score');
    } finally {
      setSaving(false);
    }
  };

  // Render the candidate's answer based on question type
  const renderAnswer = () => {
    if (!hasAnswer) return (
      <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, color: '#94a3b8', fontSize: 14, fontStyle: 'italic' }}>
        No answer provided
      </div>
    );

    if (q?.type === 'mcq_single' || q?.type === 'true_false') {
      const selectedOpt = q?.options?.find(o => o.id === response.answer);
      const correctOpt = q?.options?.find(o => o.id === q?.correctAnswer);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q?.options?.map(opt => {
            const isSelected = opt.id === response.answer;
            const isCorrect = opt.id === q?.correctAnswer;
            let bg = '#f8fafc', border = '#e2e8f0', color = '#475569';
            if (isSelected && isCorrect)  { bg = '#f0fdf4'; border = '#86efac'; color = '#16a34a'; }
            else if (isSelected && !isCorrect) { bg = '#fef2f2'; border = '#fca5a5'; color = '#e11d48'; }
            else if (!isSelected && isCorrect) { bg = '#f0fdf4'; border = '#86efac'; color = '#16a34a'; }
            return (
              <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${border}`, background: bg }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${border}`, background: isSelected ? border : 'transparent', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color, fontWeight: isSelected || isCorrect ? 600 : 400 }}>{opt.text}</span>
                {isSelected && !isCorrect && <XCircle size={15} color="#e11d48" style={{ marginLeft: 'auto' }} />}
                {isCorrect && <CheckCircle size={15} color="#16a34a" style={{ marginLeft: 'auto' }} />}
              </div>
            );
          })}
        </div>
      );
    }

    if (q?.type === 'mcq_multi') {
      const selected = Array.isArray(response.answer) ? response.answer : [];
      const correct = Array.isArray(q?.correctAnswer) ? q?.correctAnswer : [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q?.options?.map(opt => {
            const isSelected = selected.includes(opt.id);
            const isCorrect = correct.includes(opt.id);
            let bg = '#f8fafc', border = '#e2e8f0', color = '#475569';
            if (isSelected && isCorrect)  { bg = '#f0fdf4'; border = '#86efac'; color = '#16a34a'; }
            else if (isSelected && !isCorrect) { bg = '#fef2f2'; border = '#fca5a5'; color = '#e11d48'; }
            else if (!isSelected && isCorrect) { bg = '#f0fdf4'; border = '#86efac'; color = '#16a34a'; }
            return (
              <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${border}`, background: bg }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${border}`, background: isSelected ? border : 'transparent', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color, fontWeight: isSelected || isCorrect ? 600 : 400 }}>{opt.text}</span>
                {isSelected && !isCorrect && <XCircle size={15} color="#e11d48" style={{ marginLeft: 'auto' }} />}
                {isCorrect && <CheckCircle size={15} color="#16a34a" style={{ marginLeft: 'auto' }} />}
              </div>
            );
          })}
        </div>
      );
    }

    // Short answer / scenario / logic / coding
    return (
      <div>
        <div style={{
          padding: '14px 16px', background: '#f8fafc', borderRadius: 8,
          border: '1px solid #e2e8f0', fontSize: 14, color: '#334155',
          lineHeight: 1.7, whiteSpace: 'pre-wrap',
          fontFamily: q?.type === 'coding' ? 'monospace' : 'inherit',
          minHeight: 60,
        }}>
          {response.answer}
        </div>

        {/* Manual scoring input */}
        <div style={{ marginTop: 12, padding: '14px 16px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            HR Evaluation — Assign Score
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#78350f' }}>Score:</span>
            <input
              type="number"
              min="0"
              max={q?.points || 1}
              step="0.5"
              value={manualScore}
              onChange={e => setManualScore(e.target.value)}
              style={{ width: 70, padding: '6px 10px', borderRadius: 6, border: '1px solid #fcd34d', fontSize: 14, fontWeight: 700, outline: 'none', textAlign: 'center' }}
            />
            <span style={{ fontSize: 13, color: '#78350f' }}>/ {q?.points || 1} pts</span>
            <button
              onClick={handleSaveScore}
              disabled={saving}
              style={{
                padding: '6px 16px', borderRadius: 6, background: saved ? '#16a34a' : '#d97706',
                color: '#fff', border: 'none', fontWeight: 600, fontSize: 13,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Score'}
            </button>
          </div>
          {q?.explanation && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#78350f', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span><strong>Guidance:</strong> {q.explanation}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Question header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>Q{index + 1}</span>
          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: catStyle.bg, color: catStyle.color, textTransform: 'capitalize' }}>
            {q?.category}
          </span>
          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
            {TYPE_LABEL[q?.type] || q?.type}
          </span>
          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: q?.difficulty === 'hard' ? '#fef2f2' : q?.difficulty === 'medium' ? '#fffbeb' : '#f0fdf4',
            color: q?.difficulty === 'hard' ? '#e11d48' : q?.difficulty === 'medium' ? '#d97706' : '#16a34a',
          }}>
            {q?.difficulty}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {response.timeSpent > 0 && (
            <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {response.timeSpent}s
            </span>
          )}
          {!hasAnswer ? (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', padding: '3px 10px', borderRadius: 20, background: '#f1f5f9' }}>Skipped</span>
          ) : isManual ? (
            response.scoreAwarded > 0
              ? <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', padding: '3px 10px', borderRadius: 20, background: '#f0fdf4' }}>{response.scoreAwarded}/{q?.points} pts</span>
              : <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', padding: '3px 10px', borderRadius: 20, background: '#fffbeb' }}>Pending Review</span>
          ) : response.isCorrect ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={13} /> {response.scoreAwarded}/{q?.points} pts
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e11d48', padding: '3px 10px', borderRadius: 20, background: '#fef2f2', display: 'flex', alignItems: 'center', gap: 4 }}>
              <XCircle size={13} /> 0/{q?.points} pts
            </span>
          )}
        </div>
      </div>

      {/* Question body */}
      <div style={{ padding: '18px 20px' }}>
        <p style={{ fontSize: 15, color: '#0f172a', fontWeight: 500, lineHeight: 1.6, marginBottom: 16 }}>{q?.text}</p>
        {renderAnswer()}
      </div>
    </div>
  );
}

export default function AssessmentReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [responses, setResponses] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | correct | incorrect | manual | skipped

  const fetchAll = async () => {
    const [c, r, s] = await Promise.all([
      api.get(`/candidates/${id}`),
      api.get(`/responses?candidateId=${id}`).catch(() => ({ data: [] })),
      api.get(`/responses/score/${id}`).catch(() => ({ data: null })),
    ]);
    setCandidate(c.data);
    setResponses(r.data);
    setScore(s.data);
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, [id]);

  const filtered = responses.filter(r => {
    const hasAnswer = r.answer !== null && r.answer !== undefined && r.answer !== '';
    if (filter === 'correct')   return r.isCorrect === true;
    if (filter === 'incorrect') return r.isAutoScored && r.isCorrect === false;
    if (filter === 'manual')    return !r.isAutoScored && hasAnswer;
    if (filter === 'skipped')   return !hasAnswer;
    return true;
  });

  const counts = {
    all:       responses.length,
    correct:   responses.filter(r => r.isCorrect === true).length,
    incorrect: responses.filter(r => r.isAutoScored && r.isCorrect === false).length,
    manual:    responses.filter(r => !r.isAutoScored && r.answer !== null && r.answer !== undefined && r.answer !== '').length,
    skipped:   responses.filter(r => r.answer === null || r.answer === undefined || r.answer === '').length,
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading assessment review...</div>
  );

  if (!candidate) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#e11d48' }}>Candidate not found</div>
  );

  return (
    <div>
      {/* Back nav */}
      <button onClick={() => navigate(`/hr/candidates/${id}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to {candidate.name}
      </button>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Assessment Review</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
            {candidate.name} · {candidate.appliedRole?.title} · {candidate.appliedRole?.department}
          </p>
        </div>
        {score && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: score.finalScore >= 70 ? '#16a34a' : score.finalScore >= 50 ? '#d97706' : '#e11d48', lineHeight: 1 }}>
                {score.finalScore}<span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 400 }}>/100</span>
              </div>
              <div style={{ marginTop: 4, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Badge status={score.performanceBand} />
                <Badge status={score.resultStatus} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {score && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            ['Total',    responses.length,                                                                '#0f172a'],
            ['Correct',  counts.correct,                                                                  '#16a34a'],
            ['Wrong',    counts.incorrect,                                                                 '#e11d48'],
            ['Manual',   counts.manual,                                                                    '#d97706'],
            ['Skipped',  counts.skipped,                                                                   '#94a3b8'],
          ].map(([label, value, color]) => (
            <Card key={label} style={{ padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          ['all',       'All Questions',  counts.all],
          ['correct',   'Correct',        counts.correct],
          ['incorrect', 'Incorrect',      counts.incorrect],
          ['manual',    'Needs Review',   counts.manual],
          ['skipped',   'Skipped',        counts.skipped],
        ].map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: filter === key ? 'none' : '1px solid #e2e8f0',
              background: filter === key ? '#0f172a' : '#fff',
              color: filter === key ? '#fff' : '#475569',
            }}
          >
            {label} <span style={{ opacity: 0.7 }}>({count})</span>
          </button>
        ))}
      </div>

      {/* Question cards */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          No questions match this filter
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((r, i) => (
            <QuestionCard
              key={r._id}
              response={r}
              index={responses.indexOf(r)}
              onScoreUpdate={fetchAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}
