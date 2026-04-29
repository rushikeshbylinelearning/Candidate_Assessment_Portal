import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StepStatusOverview from '../../components/pipeline/hr/StepStatusOverview';
import OverrideControls from '../../components/pipeline/hr/OverrideControls';
import AggregateSummary from '../../components/pipeline/hr/AggregateSummary';
import StepDataViewer from '../../components/pipeline/hr/StepDataViewer';

export default function CandidateJourneyPage() {
  const { pipelineId } = useParams();
  const [pipelineRecord, setPipelineRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStep, setSelectedStep] = useState('');

  async function fetchPipeline() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/pipeline/${pipelineId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to load pipeline.');
      } else {
        setPipelineRecord(data);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPipeline();
  }, [pipelineId]);

  function handleOverrideSuccess() {
    fetchPipeline();
  }

  const stepTypes = pipelineRecord?.stepConfigSnapshot?.map((s) => s.stepType || s.type) || [];

  if (loading) {
    return <div style={pageStyle}><p style={{ color: '#64748b' }}>Loading pipeline...</p></div>;
  }

  if (error) {
    return <div style={pageStyle}><p style={{ color: '#ef4444' }}>{error}</p></div>;
  }

  return (
    <div style={pageStyle}>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
        Candidate Journey
      </h2>

      <section style={sectionStyle}>
        <StepStatusOverview pipelineRecord={pipelineRecord} />
      </section>

      <section style={sectionStyle}>
        <AggregateSummary pipelineRecord={pipelineRecord} />
      </section>

      <section style={sectionStyle}>
        <OverrideControls pipelineId={pipelineId} onOverrideSuccess={handleOverrideSuccess} />
      </section>

      <section style={sectionStyle}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
            View Step Data
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {stepTypes.map((step) => (
              <button
                key={step}
                onClick={() => setSelectedStep(step)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: selectedStep === step ? '#2563eb' : '#cbd5e1',
                  background: selectedStep === step ? '#eff6ff' : '#f8fafc',
                  color: selectedStep === step ? '#2563eb' : '#475569',
                  fontSize: 13,
                  fontWeight: selectedStep === step ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {step.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <StepDataViewer pipelineId={pipelineId} stepType={selectedStep} />
      </section>
    </div>
  );
}

const pageStyle = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '32px 24px',
};

const sectionStyle = {
  marginBottom: 24,
};
