import { useState } from 'react';
import { Edit3, BarChart2 } from 'lucide-react';
import { callClaude } from '../lib/claude';
import { useApp } from '../context/AppContext';
import { ThinkingLoader, EmptyState, CopyButton, ScoreBar } from './ui/SharedComponents';

const DIMENSIONS = [
  { key: 'meToYou',        label: 'Me-to-You Ratio',   desc: 'I/we vs you mentions' },
  { key: 'specificity',    label: 'Specificity',        desc: 'Real details vs generic' },
  { key: 'emotionalHook',  label: 'Emotional Hook',     desc: 'Opening curiosity level' },
  { key: 'valueClarity',   label: 'Value Clarity',      desc: 'Concreteness of benefit' },
  { key: 'ctaFriction',    label: 'CTA Friction',       desc: 'Ease of response' },
  { key: 'humanSignal',    label: 'Human Signal',       desc: 'Person vs tool feel' },
];

function generateHumanizerPrompt(message, mirror) {
  const ctx = mirror ? `\nPROSPECT MIRROR:\n- ${mirror.name}, ${mirror.title} at ${mirror.company}\n- Posture: ${mirror.emotionalPosture}\n- Inner monologue: "${mirror.innerMonologue}"\n- Pain: ${mirror.painFrequency?.detail}\n- Trust triggers: ${mirror.trustTriggers?.map(t=>t.trigger).join(', ')}\n- Landmines: ${mirror.landmines?.map(l=>l.phrase).join(', ')}` : '';
  return `Analyze and rewrite this cold outreach message.

ORIGINAL: "${message}"
${ctx}

Return ONLY valid JSON:
{
  "diagnosis": {
    "meToYou": { "score": 0-100, "detail": "...", "iCount": 0, "youCount": 0 },
    "specificity": { "score": 0-100, "detail": "..." },
    "emotionalHook": { "score": 0-100, "detail": "..." },
    "valueClarity": { "score": 0-100, "detail": "..." },
    "ctaFriction": { "score": 0-100, "detail": "..." },
    "humanSignal": { "score": 0-100, "detail": "..." },
    "overallGrade": "A|B|C|D|F",
    "overallInsight": "2-3 sentence diagnosis of the core problem"
  },
  "variants": [
    {
      "type": "peer",
      "name": "The Peer",
      "tagline": "You noticed something interesting — not a vendor pitching",
      "subjectLine": "...",
      "message": "complete rewritten message",
      "predictedReplyRate": "X-Y%",
      "replyRateReasoning": "...",
      "psychologicalTrigger": "...",
      "wordCount": 0
    },
    {
      "type": "whisperer",
      "name": "The Problem Whisperer",
      "tagline": "Lead with naming their exact pain so precisely they feel seen",
      "subjectLine": "...",
      "message": "...",
      "predictedReplyRate": "X-Y%",
      "replyRateReasoning": "...",
      "psychologicalTrigger": "...",
      "wordCount": 0
    },
    {
      "type": "short",
      "name": "The Short Game",
      "tagline": "Under 60 words. One observation. One question. Zero pitch.",
      "subjectLine": "...",
      "message": "...",
      "predictedReplyRate": "X-Y%",
      "replyRateReasoning": "...",
      "psychologicalTrigger": "...",
      "wordCount": 0
    }
  ]
}`;
}

const VARIANT_CONFIG = {
  peer:      { color: '#3A7A9B', bg: 'rgba(108,172,200,0.07)', border: 'rgba(108,172,200,0.25)', accent: 'rgba(108,172,200,0.15)', emoji: '🤝' },
  whisperer: { color: '#8B6355', bg: 'rgba(139,99,85,0.06)',   border: 'rgba(139,99,85,0.2)',   accent: 'rgba(139,99,85,0.12)',   emoji: '🧠' },
  short:     { color: '#5A7A56', bg: 'rgba(90,122,86,0.06)',   border: 'rgba(90,122,86,0.2)',   accent: 'rgba(90,122,86,0.12)',   emoji: '⚡' },
};

const GRADE_COLORS = { A: '#5A7A56', B: '#3A7A9B', C: '#8B6318', D: '#C8956C', F: '#9B5A5B' };

export default function MessageHumanizerModule() {
  const { prospectMirror, saveToHallOfFame } = useApp();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);

  const handleAnalyze = async () => {
    if (!message.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await callClaude(generateHumanizerPrompt(message, prospectMirror));
      const json = res.match(/\{[\s\S]*\}/);
      if (!json) throw new Error('Invalid response');
      setResult(JSON.parse(json[0]));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleVariantAdjust = async (idx, adjustment) => {
    if (!result) return;
    const variant = result.variants[idx];
    const map = { shorter: 'Make it 30% shorter', warmer: 'Make the tone warmer and more empathetic', direct: 'Make it more direct and confident' };
    try {
      const newMsg = await callClaude(`Take this message and ${map[adjustment]}. Return ONLY the adjusted message:\n\n"${variant.message}"`);
      const updated = { ...result };
      updated.variants[idx] = { ...variant, message: newMsg.replace(/^"|"$/g, '') };
      setResult(updated);
    } catch (e) { setError(e.message); }
  };

  const d = result?.diagnosis;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Input */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: 'rgba(108,172,200,0.1)', border: '1.5px solid rgba(108,172,200,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Edit3 size={20} color="#3A7A9B" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Message Humanizer</h2>
              {prospectMirror && <span className="tag tag-sage">🧠 Mirror: {prospectMirror.name}</span>}
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Paste any cold email or LinkedIn message — get a 6-dimension diagnosis and 3 humanized rewrites.
            </p>
          </div>
        </div>

        <textarea
          className="emp-input"
          rows={8}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={`Paste your existing cold email or LinkedIn message here…\n\nExample:\n"Hi [Name], I'm reaching out because I think our platform could help your team. We help companies like yours improve their sales performance. Would love to connect for a quick 15-minute call."`}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-light)' }}>
            {message.split(/\s+/).filter(Boolean).length} words
          </span>
          <button className="btn-primary" onClick={handleAnalyze} disabled={loading || !message.trim()}>
            <BarChart2 size={15} />
            {loading ? 'Analysing…' : 'Diagnose & Humanize'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 16, padding: '12px 18px', background: 'rgba(201,127,128,0.08)', border: '1px solid rgba(201,127,128,0.25)', borderRadius: 12, fontSize: 13.5, color: '#9B5A5B' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {loading && <div className="glass-card" style={{ padding: 24 }}><ThinkingLoader label="Diagnosing message DNA…" /></div>}

      {!loading && result && (
        <div className="animate-fade-up">

          {/* Diagnosis */}
          <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BarChart2 size={16} color="var(--caramel)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--caramel)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Message Diagnosis</span>
              </div>
              <div style={{
                width: 54, height: 54, borderRadius: '50%',
                background: `${GRADE_COLORS[d?.overallGrade] || 'var(--caramel)'}15`,
                border: `2px solid ${GRADE_COLORS[d?.overallGrade] || 'var(--caramel)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: GRADE_COLORS[d?.overallGrade] || 'var(--caramel)',
                fontFamily: 'Playfair Display, serif',
              }}>
                {d?.overallGrade}
              </div>
            </div>

            <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 24, fontStyle: 'italic', fontFamily: 'Playfair Display, serif' }}>
              "{d?.overallInsight}"
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {DIMENSIONS.map(dim => {
                const score = d?.[dim.key]?.score ?? 0;
                const isInverse = dim.key === 'ctaFriction';
                const displayScore = isInverse ? (100 - score) : score;
                return (
                  <div key={dim.key} style={{
                    padding: '16px', background: 'var(--bg-subtle)',
                    borderRadius: 12, border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 2 }}>{dim.desc}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>{dim.label}</div>
                    <ScoreBar score={displayScore} />
                    {d?.[dim.key]?.detail && (
                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 7, lineHeight: 1.55 }}>{d[dim.key].detail}</p>
                    )}
                    {dim.key === 'meToYou' && d?.meToYou && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
                        <span className="tag tag-rose">I/We: {d.meToYou.iCount}</span>
                        <span className="tag tag-sage">You: {d.meToYou.youCount}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Variants */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginBottom: 24 }}>
            {result.variants?.map((v, i) => {
              const cfg = VARIANT_CONFIG[v.type] || VARIANT_CONFIG.peer;
              return (
                <div key={i} className="variant-card" style={{
                  borderColor: selectedVariant === i ? cfg.border : 'var(--border)',
                  background: selectedVariant === i ? cfg.bg : '#FFFFFF',
                }}>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                      <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: cfg.color, fontFamily: 'Playfair Display, serif' }}>{v.name}</h4>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{v.tagline}</p>
                  </div>

                  <div style={{
                    background: cfg.accent, border: `1px solid ${cfg.border}`,
                    borderRadius: 9, padding: '7px 13px', marginBottom: 14,
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Subject: </span>
                    <span style={{ fontSize: 12.5, color: cfg.color, fontWeight: 500 }}>{v.subjectLine}</span>
                  </div>

                  <div style={{
                    background: 'var(--bg-subtle)', borderRadius: 11, padding: '14px 16px',
                    marginBottom: 14, maxHeight: 200, overflowY: 'auto',
                    border: '1px solid var(--border-soft)',
                  }}>
                    <p style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{v.message}</p>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    <span className="tag" style={{ background: cfg.accent, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      📈 {v.predictedReplyRate} reply rate
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', alignSelf: 'center' }}>
                      {v.wordCount || v.message.split(/\s+/).length} words
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Trigger: </strong>{v.psychologicalTrigger}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <CopyButton text={v.message} />
                    <button onClick={() => handleVariantAdjust(i, 'shorter')} className="btn-ghost">↓ Shorter</button>
                    <button onClick={() => handleVariantAdjust(i, 'warmer')}  className="btn-ghost">♥ Warmer</button>
                    <button onClick={() => handleVariantAdjust(i, 'direct')}  className="btn-ghost">→ Direct</button>
                    <button
                      onClick={() => saveToHallOfFame({ module: 'Humanizer', variant: v.name, text: v.message, subjectLine: v.subjectLine })}
                      className="btn-ghost"
                      style={{ color: '#8B6318', borderColor: 'rgba(200,149,108,0.3)' }}
                    >★ Save</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Which would you reply to */}
          <div className="glass-card" style={{ padding: 22, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, fontFamily: 'Playfair Display, serif' }}>Which would you personally respond to?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              {result.variants?.map((v, i) => {
                const cfg = VARIANT_CONFIG[v.type] || VARIANT_CONFIG.peer;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(selectedVariant === i ? null : i)}
                    style={{
                      padding: '10px 22px', borderRadius: 11,
                      background: selectedVariant === i ? cfg.bg : 'var(--bg-subtle)',
                      border: `1.5px solid ${selectedVariant === i ? cfg.border : 'var(--border)'}`,
                      color: selectedVariant === i ? cfg.color : 'var(--text-secondary)',
                      cursor: 'pointer', fontWeight: 600, fontSize: 13.5,
                      fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
                    }}
                  >
                    {cfg.emoji} {v.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!loading && !result && (
        <EmptyState
          icon={Edit3}
          title="Paste your message above"
          description="Any cold email, LinkedIn DM, or outreach draft. We'll diagnose it across 6 dimensions and rewrite it in 3 psychologically distinct variants."
        />
      )}
    </div>
  );
}
