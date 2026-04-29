import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { MessageSquare, Star } from 'lucide-react';
import '../../styles/Notes.css';
import '../../styles/SquircleHeader.css';

export default function Notes() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notes').then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Squircle Header */}
      <div className="squircle-header">
        <div className="squircle-header-icon">
          <MessageSquare size={20} />
        </div>
        <div className="squircle-header-content">
          <h1>Interview Logs</h1>
          <p>All interview notes and evaluations</p>
        </div>
      </div>

      {loading ? <div className="notes-loading">Loading...</div> : logs.length === 0 ? (
        <div className="notes-empty">
          <MessageSquare size={40} className="notes-empty-icon" />
          No interview logs yet
        </div>
      ) : (
        <div className="notes-list">
          {logs.map(log => (
            <Card key={log._id}>
              <div className="note-card-header">
                <div className="note-candidate-info">
                  <div className="note-candidate-name">{log.candidateId?.name}</div>
                  <div className="note-candidate-email">{log.candidateId?.email}</div>
                </div>
                <div className="note-meta">
                  <div className="note-rating">
                    <Star size={14} color="#d97706" fill="#d97706" />
                    <span className="note-rating-value">{log.rating}/10</span>
                  </div>
                  <Badge label={log.stage} variant="info" />
                  <Badge status={log.recommendation === 'proceed' ? 'success' : log.recommendation === 'reject' ? 'danger' : 'warning'} label={log.recommendation} />
                </div>
              </div>
              <div className="note-round">{log.round}</div>
              {log.notes && <p className="note-text">{log.notes}</p>}
              <div className="note-skills">
                {log.strengths?.length > 0 && <span className="note-strengths">✓ {log.strengths.join(', ')}</span>}
                {log.weaknesses?.length > 0 && <span className="note-weaknesses">✗ {log.weaknesses.join(', ')}</span>}
              </div>
              {log.nextAction && <div className="note-next-action">→ {log.nextAction}</div>}
              <div className="note-footer">
                By {log.interviewerId?.name} · {new Date(log.createdAt).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
