import { useState } from 'react';
import { Star, Trash2, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState, CopyButton } from './ui/SharedComponents';

const MODULE_CONFIG = {
  Mirror:        { color: 'var(--caramel)', bg: 'rgba(200,149,108,0.1)',  border: 'rgba(200,149,108,0.3)',  emoji: '🧠' },
  Humanizer:     { color: '#3A7A9B',        bg: 'rgba(58,122,155,0.08)',  border: 'rgba(58,122,155,0.25)',  emoji: '✍️' },
  'Follow-up':   { color: '#5A7A56',        bg: 'rgba(90,122,86,0.08)',   border: 'rgba(90,122,86,0.22)',   emoji: '⏱️' },
  'Reply Decoder':{ color: '#A67C52',       bg: 'rgba(166,124,82,0.08)',  border: 'rgba(166,124,82,0.25)',  emoji: '🔍' },
};

export default function HallOfFame() {
  const { hallOfFame, removeFromHallOfFame } = useApp();
  const [filter, setFilter] = useState('all');

  const modules = ['all', ...new Set(hallOfFame.map(e => e.module))];
  const filtered = filter === 'all' ? hallOfFame : hallOfFame.filter(e => e.module === filter);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: 'rgba(212,169,106,0.15)', border: '1.5px solid rgba(212,169,106,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={20} color="#8B6318" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Hall of Fame</h2>
              <span className="tag tag-gold">{hallOfFame.length} saved</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your best-performing messages — saved for inspiration and pattern learning.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      {hallOfFame.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {modules.map(m => {
            const cfg = MODULE_CONFIG[m];
            const isActive = filter === m;
            return (
              <button
                key={m}
                onClick={() => setFilter(m)}
                style={{
                  padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.18s',
                  background: isActive ? (cfg?.bg || 'var(--bisque-light)') : 'var(--bg-card)',
                  border: `1.5px solid ${isActive ? (cfg?.border || 'var(--border-hover)') : 'var(--border)'}`,
                  color: isActive ? (cfg?.color || 'var(--espresso)') : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--shadow-soft)' : 'none',
                }}
              >
                {m === 'all' ? 'All Messages' : `${cfg?.emoji || '📋'} ${m}`}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No messages saved yet"
          description="As you generate messages across any module, click the ★ Save to Hall of Fame button to collect your best work here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(entry => {
            const cfg = MODULE_CONFIG[entry.module] || { color: 'var(--caramel)', bg: 'var(--bisque-light)', border: 'var(--border-hover)', emoji: '📋' };
            return (
              <div key={entry.id} className="hof-entry">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="tag" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.emoji} {entry.module}
                    </span>
                    {entry.variant  && <span className="tag tag-bisque">{entry.variant}</span>}
                    {entry.sentiment && <span className="tag tag-caramel">{entry.sentiment}</span>}
                    {entry.prospect && <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>for {entry.prospect}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} />{new Date(entry.savedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => removeFromHallOfFame(entry.id)}
                      className="btn-ghost"
                      style={{ color: '#9B5A5B', borderColor: 'rgba(201,127,128,0.25)', padding: '5px 9px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {entry.subjectLine && (
                  <div style={{ padding: '7px 13px', background: 'var(--bisque-light)', border: '1px solid var(--border-hover)', borderRadius: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Subject: </span>
                    <span style={{ fontSize: 13, color: cfg.color, fontWeight: 500 }}>{entry.subjectLine}</span>
                  </div>
                )}

                <div style={{
                  padding: '16px 18px', background: 'rgba(255,255,255,0.7)',
                  borderRadius: 12, marginBottom: 14,
                  borderLeft: `3px solid ${cfg.color}70`,
                }}>
                  <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {entry.text?.slice(0, 400)}{entry.text?.length > 400 ? '…' : ''}
                  </p>
                </div>

                <CopyButton text={entry.text || ''} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
