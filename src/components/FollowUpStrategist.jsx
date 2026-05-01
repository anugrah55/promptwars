import { useState } from 'react';
import { Clock, TrendingDown } from 'lucide-react';
import { callClaude } from '../lib/claude';
import { useApp } from '../context/AppContext';
import { ThinkingLoader, EmptyState, CopyButton, MessageActions } from './ui/SharedComponents';

const STALL_TAXONOMY = [
  { id: 'interest_decay',  label: 'Interest Decay',      emoji: '📉', color: '#8B6355' },
  { id: 'priority_shift',  label: 'Priority Shift',       emoji: '🔀', color: '#8B6318' },
  { id: 'unclear_value',   label: 'Unclear Value',        emoji: '❓', color: '#3A7A9B' },
  { id: 'social_awkward',  label: 'Social Awkwardness',   emoji: '😬', color: '#5A7A56' },
  { id: 'timing_mismatch', label: 'Timing Mismatch',      emoji: '⏰', color: '#C8956C' },
  { id: 'ghosting_defense',label: 'Ghosting Defence',     emoji: '👻', color: '#9B5A5B' },
];

function generateFollowUpPrompt(history, mirror) {
  const ctx = mirror ? `\nPROSPECT MIRROR:\n- ${mirror.name}, ${mirror.title}\n- Posture: ${mirror.emotionalPosture}\n- Pain: ${mirror.painFrequency?.headline}` : '';
  return `Analyse this stalled conversation and recommend a follow-up strategy.

CONVERSATION HISTORY:
${history}
${ctx}

Return ONLY valid JSON:
{
  "stallDiagnosis": {
    "primary": "interest_decay|priority_shift|unclear_value|social_awkward|timing_mismatch|ghosting_defense",
    "confidence": 0-100,
    "reasoning": "2-3 sentence explanation"
  },
  "stallProbabilities": {
    "interest_decay": 0-100,
    "priority_shift": 0-100,
    "unclear_value": 0-100,
    "social_awkward": 0-100,
    "timing_mismatch": 0-100,
    "ghosting_defense": 0-100
  },
  "reEngagementStrategy": {
    "optimalWaitDays": 0,
    "waitReasoning": "why this specific window",
    "optimalChannel": "same email thread|new email|linkedin dm|phone call",
    "channelReasoning": "why this channel",
    "tone": "acknowledge silence|ignore silence|reference new info",
    "toneReasoning": "psychological reasoning"
  },
  "followUpMessages": [
    { "label": "Primary recommendation", "message": "Complete ready-to-send message. No [placeholder] brackets.", "reasoning": "why this matches the diagnosis" },
    { "label": "Alternative: If too busy",  "message": "Shorter alternative", "reasoning": "when to use this" }
  ],
  "keyInsight": "The single most important thing to understand about this specific situation"
}`;
}

export default function FollowUpStrategistModule() {
  const { prospectMirror, saveToHallOfFame } = useApp();
  const [history, setHistory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!history.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await callClaude(generateFollowUpPrompt(history, prospectMirror));
      const json = res.match(/\{[\s\S]*\}/);
      if (!json) throw new Error('Invalid response');
      setResult(JSON.parse(json[0]));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const primaryStall = result ? STALL_TAXONOMY.find(s => s.id === result.stallDiagnosis?.primary) : null;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>

      {/* Input */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: 'rgba(143,175,138,0.12)', border: '1.5px solid rgba(143,175,138,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={20} color="#5A7A56" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Follow-Up Strategist</h2>
              {prospectMirror && <span className="tag tag-sage">🧠 Mirror: {prospectMirror.name}</span>}
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Paste a stalled conversation — find out exactly why it went cold and how to re-engage.</p>
          </div>
        </div>

        <textarea
          className="emp-input"
          rows={10}
          value={history}
          onChange={e => setHistory(e.target.value)}
          placeholder={`Paste the full conversation history here. Include:\n- Your initial outreach message\n- Any responses (or lack thereof)\n- Follow-ups you've sent\n- Call notes if applicable\n\nExample:\n---\nEmail 1 (March 15): "Hi Sarah, I noticed your team recently…"\nReply (March 17): "Thanks for reaching out! Let me check with my team."\nEmail 2 (March 24): "Just following up on this…"\n[No reply — 2 weeks passed]\n---`}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn-primary" onClick={handleAnalyze} disabled={loading || !history.trim()}>
            <TrendingDown size={15} />
            {loading ? 'Diagnosing…' : 'Diagnose Stall & Get Strategy'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 16, padding: '12px 18px', background: 'rgba(201,127,128,0.08)', border: '1px solid rgba(201,127,128,0.25)', borderRadius: 12, fontSize: 13.5, color: '#9B5A5B' }}>⚠️ {error}</div>
        )}
      </div>

      {loading && <div className="glass-card" style={{ padding: 24 }}><ThinkingLoader label="Analysing stall pattern…" /></div>}

      {!loading && result && (
        <div className="animate-fade-up">

          {/* Primary Diagnosis */}
          {primaryStall && (
            <div style={{
              padding: 28, borderRadius: 20, marginBottom: 20,
              background: `${primaryStall.color}08`,
              border: `1.5px solid ${primaryStall.color}30`,
              boxShadow: 'var(--shadow-soft)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                    <span style={{ fontSize: 32 }}>{primaryStall.emoji}</span>
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 3 }}>Primary Stall Diagnosis</p>
                      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: primaryStall.color }}>{primaryStall.label}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 520 }}>{result.stallDiagnosis.reasoning}</p>
                </div>
                <div style={{
                  padding: '12px 18px', borderRadius: 14,
                  background: `${primaryStall.color}12`, textAlign: 'center',
                  border: `1px solid ${primaryStall.color}25`,
                }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: primaryStall.color, fontFamily: 'Playfair Display, serif' }}>{result.stallDiagnosis.confidence}%</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Confidence</div>
                </div>
              </div>
            </div>
          )}

          {/* Stall Probabilities */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--caramel)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>Stall Probability by Cause</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {STALL_TAXONOMY.map(s => {
                const prob = result.stallProbabilities?.[s.id] || 0;
                const isPrimary = result.stallDiagnosis?.primary === s.id;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{s.emoji}</span>
                    <span style={{ fontSize: 13.5, color: isPrimary ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isPrimary ? 600 : 400, width: 160, flexShrink: 0 }}>{s.label}</span>
                    <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: isPrimary ? s.color : `${s.color}60`,
                        width: `${prob}%`, transition: 'width 0.8s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: isPrimary ? s.color : 'var(--text-light)', width: 42, textAlign: 'right' }}>{prob}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategy */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3A7A9B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>Re-engagement Strategy</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { label: '⏱ Optimal Wait',   value: `${result.reEngagementStrategy?.optimalWaitDays} days`,  color: '#3A7A9B', reason: result.reEngagementStrategy?.waitReasoning },
                { label: '📨 Best Channel',   value: result.reEngagementStrategy?.optimalChannel?.replace(/_/g,' '), color: '#8B6355', reason: result.reEngagementStrategy?.channelReasoning },
                { label: '🎭 Tone',           value: result.reEngagementStrategy?.tone?.replace(/_/g,' '), color: '#8B6318', reason: result.reEngagementStrategy?.toneReasoning },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px 18px', background: 'var(--bg-subtle)', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{item.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: item.color, marginBottom: 8, fontFamily: 'Playfair Display, serif', textTransform: 'capitalize' }}>{item.value}</p>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insight */}
          <div style={{
            padding: '18px 22px', borderRadius: 14, marginBottom: 24,
            background: 'var(--bisque-light)', border: '1.5px solid var(--border-hover)',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <p style={{ fontSize: 11, color: 'var(--caramel)', fontWeight: 700, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' }}>💡 Key Insight</p>
            <p style={{ fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.75, fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>{result.keyInsight}</p>
          </div>

          {/* Follow-up Messages */}
          <div style={{ marginBottom: 24 }}>
            {result.followUpMessages?.map((msg, i) => (
              <div key={i} className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                  <span className={`tag ${i === 0 ? 'tag-sage' : 'tag-bisque'}`}>{i === 0 ? '✦ Primary' : 'Alternative'}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{msg.label}</span>
                </div>
                <div style={{
                  padding: '18px', background: 'var(--bg-subtle)',
                  borderRadius: 12, marginBottom: 14,
                  borderLeft: `3px solid ${i === 0 ? '#5A7A56' : 'var(--caramel)'}`,
                }}>
                  <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 14 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Why this works: </strong>{msg.reasoning}
                </p>
                <MessageActions
                  text={msg.message}
                  onSave={() => saveToHallOfFame({ module: 'Follow-up', label: msg.label, text: msg.message })}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !result && (
        <EmptyState
          icon={Clock}
          title="Paste the stalled conversation"
          description="Include everything: your initial message, their last response (or lack of), any follow-ups. We'll diagnose exactly why it went cold and give you a precise re-engagement strategy."
        />
      )}
    </div>
  );
}
