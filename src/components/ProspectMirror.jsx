import { useState } from 'react';
import { Brain, MessageSquare, AlertTriangle, Zap, Shield, TrendingUp, ChevronRight } from 'lucide-react';
import { callClaude, MIRROR_SYSTEM } from '../lib/claude';
import { useApp } from '../context/AppContext';
import { ThinkingLoader, EmptyState, CopyButton, MessageActions } from './ui/SharedComponents';

const POSTURE_CONFIG = {
  skeptic:     { color: '#9B5A5B', bg: 'rgba(201,127,128,0.1)',  border: 'rgba(201,127,128,0.3)',  label: '🛡️ The Skeptic',         desc: 'Default answer is no. Has been burned.' },
  explorer:    { color: '#3A7A9B', bg: 'rgba(108,172,200,0.1)',  border: 'rgba(108,172,200,0.3)',  label: '🔭 The Explorer',         desc: 'Actively looking. Open-minded.' },
  champion:    { color: '#5A7A56', bg: 'rgba(143,175,138,0.1)',  border: 'rgba(143,175,138,0.3)',  label: '🏆 Champion-Seeker',      desc: 'Wants to be the internal hero.' },
  gatekeeper:  { color: '#8B6318', bg: 'rgba(212,169,106,0.1)',  border: 'rgba(212,169,106,0.3)',  label: '🚪 Gatekeeper',           desc: 'Protects their boss\'s time.' },
};

function generateMirrorPrompt(input) {
  return `Prospect signal: "${input}"

Build a complete Psychographic Mirror for this prospect. Return ONLY valid JSON in this exact structure:

{
  "name": "inferred or stated name",
  "title": "their role",
  "company": "company name",
  "professionalIdentity": {
    "whatTheyNeedToProve": "1-2 sentences",
    "successDefinition": "what does success look like in their role",
    "evaluatedOn": ["metric 1", "metric 2", "metric 3"]
  },
  "emotionalPosture": "skeptic|explorer|champion|gatekeeper",
  "postureReasoning": "2 sentences explaining why",
  "innerMonologue": "3-sentence stream of consciousness as if you ARE them reading cold outreach right now. Be visceral and specific.",
  "painFrequency": {
    "headline": "The specific frustration in one punchy sentence",
    "detail": "2-3 sentences being hyper-specific about the daily pain.",
    "frequency": "how often this happens"
  },
  "trustTriggers": [
    { "trigger": "what makes them lean in", "reason": "psychological why" },
    { "trigger": "...", "reason": "..." },
    { "trigger": "...", "reason": "..." }
  ],
  "conversationStarters": [
    { "rank": 1, "opener": "The exact opening line", "specificDetail": "what detail this references", "valueProp": "how it connects to value", "reasoning": "why this works on THIS person" },
    { "rank": 2, "opener": "...", "specificDetail": "...", "valueProp": "...", "reasoning": "..." },
    { "rank": 3, "opener": "...", "specificDetail": "...", "valueProp": "...", "reasoning": "..." },
    { "rank": 4, "opener": "...", "specificDetail": "...", "valueProp": "...", "reasoning": "..." },
    { "rank": 5, "opener": "...", "specificDetail": "...", "valueProp": "...", "reasoning": "..." }
  ],
  "landmines": [
    { "phrase": "thing NOT to say", "whyItKills": "psychological reason" },
    { "phrase": "...", "whyItKills": "..." },
    { "phrase": "...", "whyItKills": "..." }
  ],
  "recentSignals": ["signal 1", "signal 2", "signal 3"]
}`;
}

// ─ Inline style helpers ──────────────────────────────────────
const card = (extra = {}) => ({
  background: '#FFFFFF',
  border: '1.5px solid var(--border)',
  borderRadius: 18,
  padding: 24,
  boxShadow: 'var(--shadow-soft)',
  ...extra,
});

const label = (color = 'var(--text-muted)') => ({
  fontSize: 10.5, color, textTransform: 'uppercase',
  letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6,
});

export default function ProspectMirrorModule() {
  const { prospectMirror, setProspectMirror, setActiveModule, saveToHallOfFame } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStarter, setSelectedStarter] = useState(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true); setError('');
    try {
      const result = await callClaude(generateMirrorPrompt(input), MIRROR_SYSTEM);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');
      setProspectMirror(JSON.parse(jsonMatch[0]));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDraftMessage = async () => {
    if (!prospectMirror) return;
    setDraftLoading(true);
    const starter = selectedStarter !== null
      ? prospectMirror.conversationStarters[selectedStarter]
      : prospectMirror.conversationStarters[0];
    const prompt = `Based on this Prospect Mirror:
Name/Title: ${prospectMirror.name}, ${prospectMirror.title} at ${prospectMirror.company}
Inner monologue: ${prospectMirror.innerMonologue}
Pain: ${prospectMirror.painFrequency.detail}
Emotional posture: ${prospectMirror.emotionalPosture}
Best conversation starter: ${starter.opener}
Landmines to avoid: ${prospectMirror.landmines.map(l => l.phrase).join(', ')}
Trust triggers: ${prospectMirror.trustTriggers.map(t => t.trigger).join(', ')}

Write a complete cold outreach message (120-180 words). No placeholders. Human, warm, specific. Return ONLY the message.`;
    try {
      const msg = await callClaude(prompt);
      setDraftMessage(msg);
    } catch (e) { setError(e.message); }
    finally { setDraftLoading(false); }
  };

  const posture = prospectMirror ? (POSTURE_CONFIG[prospectMirror.emotionalPosture] || POSTURE_CONFIG.skeptic) : null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* ── Input card ─────────────────────────────── */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: 'var(--bisque-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--border-hover)',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <Brain size={20} color="var(--caramel)" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Prospect Mirror
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Paste a LinkedIn URL or describe your prospect — get their full psychological profile before you write a word.
            </p>
          </div>
        </div>

        <textarea
          className="emp-input"
          rows={5}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Paste a LinkedIn URL like https://linkedin.com/in/username\n— or —\nDescribe manually: "Sarah Chen, VP of Sales at a 200-person B2B SaaS company. Recently raised Series B. Posts about pipeline efficiency and CRM bloat."\n\nThe more context you give, the sharper the mirror.`}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn-primary" onClick={handleAnalyze} disabled={loading || !input.trim()}>
            <Brain size={15} />
            {loading ? 'Building Mirror…' : 'Build Psychographic Mirror'}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 16, padding: '13px 18px',
            background: 'rgba(201,127,128,0.08)', border: '1px solid rgba(201,127,128,0.25)',
            borderRadius: 12, fontSize: 13.5, color: '#9B5A5B',
          }}>⚠️ {error}</div>
        )}
      </div>

      {/* ── Loading ─────────────────────────────────── */}
      {loading && (
        <div className="glass-card" style={{ padding: 24 }}>
          <ThinkingLoader label="Constructing psychographic model…" />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 4, paddingBottom: 8 }}>
            {['Emotional profiling', 'Pain mapping', 'Trust calibration', 'Conversation design'].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="skeleton" style={{ width: 90, height: 6, marginBottom: 7 }} />
                <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Output ──────────────────────────────────── */}
      {!loading && prospectMirror && (
        <div className="animate-fade-up">

          {/* Header Mirror Card */}
          <div className="mirror-card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {prospectMirror.name}
                </h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{prospectMirror.title} · {prospectMirror.company}</p>
              </div>
              {posture && (
                <div style={{
                  padding: '12px 18px', borderRadius: 14,
                  background: posture.bg, border: `1.5px solid ${posture.border}`,
                  textAlign: 'center', maxWidth: 200,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: posture.color }}>{posture.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{posture.desc}</div>
                </div>
              )}
            </div>
            {prospectMirror.recentSignals?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {prospectMirror.recentSignals.map((sig, i) => (
                  <span key={i} className="tag tag-cyan">📡 {sig}</span>
                ))}
              </div>
            )}
          </div>

          {/* 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Professional Identity */}
            <div style={card()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <TrendingUp size={15} color="var(--caramel)" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--caramel)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Professional Identity</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <p style={label()}>What they need to prove</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>{prospectMirror.professionalIdentity?.whatTheyNeedToProve}</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <p style={label()}>Success looks like</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>{prospectMirror.professionalIdentity?.successDefinition}</p>
              </div>
              <div>
                <p style={{ ...label(), marginBottom: 9 }}>Evaluated on</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {prospectMirror.professionalIdentity?.evaluatedOn?.map((m, i) => (
                    <span key={i} className="tag tag-bisque">{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pain Frequency */}
            <div style={card({ background: 'linear-gradient(145deg, #FFF8F2 0%, #FFF4EC 100%)', borderColor: 'rgba(201,127,128,0.25)' })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Zap size={15} color="#9B5A5B" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9B5A5B', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pain Frequency</span>
              </div>
              <p style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 16, fontWeight: 600, fontStyle: 'italic',
                color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.6,
              }}>
                "{prospectMirror.painFrequency?.headline}"
              </p>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 12 }}>
                {prospectMirror.painFrequency?.detail}
              </p>
              <span className="tag tag-rose">⏱ {prospectMirror.painFrequency?.frequency}</span>
            </div>
          </div>

          {/* Inner Monologue */}
          <div style={card({ background: 'linear-gradient(145deg, #FDFAF5 0%, #FBF5EC 100%)', marginBottom: 16 })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <MessageSquare size={15} color="var(--walnut)" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--walnut)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Inner Monologue</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— what they're thinking when they see your message</span>
            </div>
            <div style={{
              padding: '18px 22px',
              background: 'rgba(255,244,232,0.7)',
              borderRadius: 12,
              borderLeft: '3px solid var(--caramel)',
              fontStyle: 'italic',
              fontSize: 15.5,
              lineHeight: 1.85,
              color: 'var(--text-primary)',
              fontFamily: 'Playfair Display, serif',
            }}>
              "{prospectMirror.innerMonologue}"
            </div>
          </div>

          {/* Trust Triggers */}
          <div style={card({ marginBottom: 16 })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Shield size={15} color="#5A7A56" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#5A7A56', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Trust Triggers</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prospectMirror.trustTriggers?.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, padding: '13px 16px',
                  background: 'rgba(143,175,138,0.07)',
                  borderRadius: 12, border: '1px solid rgba(143,175,138,0.2)',
                }}>
                  <span style={{ color: '#5A7A56', fontSize: 16, flexShrink: 0 }}>✓</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{t.trigger}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation Starters */}
          <div style={card({ marginBottom: 16 })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <MessageSquare size={15} color="#3A7A9B" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#3A7A9B', textTransform: 'uppercase', letterSpacing: '0.07em' }}>5 Conversation Starters</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prospectMirror.conversationStarters?.map((s, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedStarter(selectedStarter === i ? null : i)}
                  style={{
                    padding: '15px 18px', borderRadius: 14,
                    border: `1.5px solid ${selectedStarter === i ? 'rgba(108,172,200,0.5)' : 'var(--border)'}`,
                    background: selectedStarter === i ? 'rgba(108,172,200,0.07)' : 'var(--bg-subtle)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                      background: selectedStarter === i ? 'rgba(108,172,200,0.18)' : 'var(--bisque-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      color: selectedStarter === i ? '#3A7A9B' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}>
                      {s.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65, marginBottom: selectedStarter === i ? 12 : 0 }}>{s.opener}</p>
                      {selectedStarter === i && (
                        <div className="animate-fade-up">
                          <p style={{ fontSize: 12, color: '#3A7A9B', marginBottom: 8 }}>References: {s.specificDetail}</p>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 10 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Why it works: </strong>{s.reasoning}
                          </p>
                          <CopyButton text={s.opener} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Landmines */}
          <div style={card({ marginBottom: 32 })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <AlertTriangle size={15} color="#8B6318" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#8B6318', textTransform: 'uppercase', letterSpacing: '0.07em' }}>3 Landmines</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— never say these to this person</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prospectMirror.landmines?.map((l, i) => (
                <div key={i} style={{
                  padding: '14px 18px', borderRadius: 12,
                  background: 'rgba(212,169,106,0.08)',
                  border: '1px solid rgba(212,169,106,0.25)',
                }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>💣</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#8B6318', marginBottom: 4 }}>"{l.phrase}"</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{l.whyItKills}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Draft CTA */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: draftMessage ? 24 : 0 }}>
            <button className="btn-primary" onClick={handleDraftMessage} disabled={draftLoading} style={{ fontSize: 15, padding: '14px 36px' }}>
              <MessageSquare size={17} />
              {draftLoading ? 'Drafting…' : 'Draft Cold Message Using These Insights'}
              <ChevronRight size={15} />
            </button>
          </div>

          {draftMessage && (
            <div className="animate-fade-up glass-card" style={{ padding: 24 }}>
              <p style={{ ...label('var(--text-muted)'), marginBottom: 14 }}>Drafted Message</p>
              <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{draftMessage}</p>
              <MessageActions
                text={draftMessage}
                onSave={() => saveToHallOfFame({ module: 'Mirror', text: draftMessage, prospect: prospectMirror.name })}
              />
            </div>
          )}
        </div>
      )}

      {!loading && !prospectMirror && (
        <EmptyState
          icon={Brain}
          title="No mirror built yet"
          description="Describe your prospect above — a LinkedIn URL, their name + title, recent posts, anything. The more context, the more precise the psychological model."
        />
      )}
    </div>
  );
}
