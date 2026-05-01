import { useState } from 'react';
import { Inbox, ArrowRight } from 'lucide-react';
import { callClaude } from '../lib/claude';
import { useApp } from '../context/AppContext';
import { ThinkingLoader, EmptyState, CopyButton, MessageActions } from './ui/SharedComponents';

const SENTIMENT_MAP = {
  'Intrigued':              { color: '#5A7A56', bg: 'rgba(90,122,86,0.08)',    border: 'rgba(90,122,86,0.25)',    emoji: '🔥' },
  'Polite Decline':         { color: '#9B5A5B', bg: 'rgba(155,90,91,0.08)',    border: 'rgba(155,90,91,0.25)',    emoji: '🙅' },
  'Stalling':               { color: '#8B6318', bg: 'rgba(139,99,24,0.08)',    border: 'rgba(139,99,24,0.25)',    emoji: '🕐' },
  'Genuinely Busy':         { color: '#8B6355', bg: 'rgba(139,99,85,0.08)',    border: 'rgba(139,99,85,0.25)',    emoji: '⚡' },
  'Interested But Cautious':{ color: '#3A7A9B', bg: 'rgba(58,122,155,0.08)',   border: 'rgba(58,122,155,0.25)',   emoji: '🔭' },
  'Delegating':             { color: '#C8956C', bg: 'rgba(200,149,108,0.1)',   border: 'rgba(200,149,108,0.3)',   emoji: '👆' },
  'Competitive Probe':      { color: '#A67C52', bg: 'rgba(166,124,82,0.08)',   border: 'rgba(166,124,82,0.25)',   emoji: '🎯' },
};

function generateDecoderPrompt(reply, mirror) {
  const ctx = mirror ? `\nPROSPECT CONTEXT:\n- ${mirror.name}, ${mirror.title} at ${mirror.company}\n- Posture: ${mirror.emotionalPosture}` : '';
  return `Decode this prospect reply with deep psychological analysis.

PROSPECT REPLY: "${reply}"
${ctx}

Return ONLY valid JSON:
{
  "sentiment": "Intrigued|Polite Decline|Stalling|Genuinely Busy|Interested But Cautious|Delegating|Competitive Probe",
  "sentimentConfidence": 0-100,
  "sentimentReasoning": "2-3 sentences",
  "buyingSignals": [
    { "signal": "specific text/phrase", "interpretation": "what this means", "strength": "strong|medium|weak", "type": "pricing_interest|internal_champion|timeline_hint|competitive_check|authority_signal|engagement_signal" }
  ],
  "subtextDecode": {
    "whatTheyAreSaying": "surface message",
    "whatTheyAreNotSaying": "the subtext",
    "whatTheyNeed": "what would make them take the next step"
  },
  "conversionProbability": {
    "percentage": 0-100,
    "reasoning": "specific reasoning based on the signals",
    "keyFactors": ["factor 1", "factor 2", "factor 3"]
  },
  "nextMove": {
    "recommendedAction": "exact next action",
    "timing": "send now|wait X days|call first",
    "message": "The exact message to send. No template placeholders.",
    "subjectLine": "subject line if email",
    "reasoning": "why this approach for this reply",
    "whatToAvoid": "the one thing NOT to do"
  }
}`;
}

export default function ReplyDecoderModule() {
  const { prospectMirror, saveToHallOfFame } = useApp();
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleDecode = async () => {
    if (!reply.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await callClaude(generateDecoderPrompt(reply, prospectMirror));
      const json = res.match(/\{[\s\S]*\}/);
      if (!json) throw new Error('Invalid response');
      setResult(JSON.parse(json[0]));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const sentCfg = result ? (SENTIMENT_MAP[result.sentiment] || { color: 'var(--caramel)', bg: 'var(--bisque-light)', border: 'var(--border-hover)', emoji: '💬' }) : null;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>

      {/* Input */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: 'rgba(166,124,82,0.1)', border: '1.5px solid rgba(166,124,82,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Inbox size={20} color="#A67C52" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Reply Decoder</h2>
              {prospectMirror && <span className="tag tag-caramel">🧠 Mirror: {prospectMirror.name}</span>}
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Paste any prospect reply — even a one-liner — get the subtext, buying signals, and exact next move.
            </p>
          </div>
        </div>

        <textarea
          className="emp-input"
          rows={5}
          value={reply}
          onChange={e => setReply(e.target.value)}
          placeholder={`Paste the prospect's reply here — even a one-liner works.\n\nExamples:\n• "Thanks for reaching out! This is interesting but now isn't the right time."\n• "Can you send me some more information?"\n• "We're actually already looking at a few vendors for this."\n• "Sounds good, let me loop in my colleague Sarah."\n• "What does pricing look like?"`}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn-primary" onClick={handleDecode} disabled={loading || !reply.trim()}>
            <Inbox size={15} />
            {loading ? 'Decoding…' : 'Decode This Reply'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 16, padding: '12px 18px', background: 'rgba(201,127,128,0.08)', border: '1px solid rgba(201,127,128,0.25)', borderRadius: 12, fontSize: 13.5, color: '#9B5A5B' }}>⚠️ {error}</div>
        )}
      </div>

      {loading && <div className="glass-card" style={{ padding: 24 }}><ThinkingLoader label="Decoding buyer psychology…" /></div>}

      {!loading && result && (
        <div className="animate-fade-up">

          {/* Sentiment + Probability */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>

            {/* Sentiment */}
            <div style={{
              padding: 26, borderRadius: 20,
              background: sentCfg?.bg, border: `1.5px solid ${sentCfg?.border}`,
              boxShadow: 'var(--shadow-soft)',
            }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>Sentiment Classification</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <span style={{ fontSize: 38 }}>{sentCfg?.emoji}</span>
                <div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: sentCfg?.color, marginBottom: 5 }}>{result.sentiment}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.08)', width: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: sentCfg?.color, width: `${result.sentimentConfidence}%` }} />
                    </div>
                    <span style={{ fontSize: 12.5, color: sentCfg?.color, fontWeight: 600 }}>{result.sentimentConfidence}% confident</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.sentimentReasoning}</p>
            </div>

            {/* Conversion Probability */}
            <div className="glass-card" style={{ padding: 26 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 14 }}>Conversion Probability</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 74, height: 74, borderRadius: '50%', flexShrink: 0,
                  background: `conic-gradient(${result.conversionProbability?.percentage >= 70 ? '#5A7A56' : result.conversionProbability?.percentage >= 40 ? 'var(--caramel)' : '#9B5A5B'} ${result.conversionProbability?.percentage * 3.6}deg, var(--bg-secondary) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 19, fontWeight: 700, fontFamily: 'Playfair Display, serif',
                    color: result.conversionProbability?.percentage >= 70 ? '#5A7A56' : result.conversionProbability?.percentage >= 40 ? 'var(--caramel)' : '#9B5A5B',
                  }}>{result.conversionProbability?.percentage}%</div>
                </div>
                <div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 10 }}>{result.conversionProbability?.reasoning}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {result.conversionProbability?.keyFactors?.map((f, i) => (
                      <span key={i} className="tag tag-bisque" style={{ fontSize: 10 }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buying Signals */}
          {result.buyingSignals?.length > 0 && (
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8B6318', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>🔍 Buying Signal Scan</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.buyingSignals.map((sig, i) => (
                  <div key={i} style={{
                    padding: '13px 16px', borderRadius: 12,
                    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}>
                    <span className={`tag ${sig.strength === 'strong' ? 'tag-sage' : sig.strength === 'medium' ? 'tag-gold' : 'tag-bisque'}`} style={{ flexShrink: 0 }}>
                      {sig.strength}
                    </span>
                    <div>
                      <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 3, fontWeight: 500 }}>"{sig.signal}"</p>
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{sig.interpretation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtext Decode */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--walnut)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>🧠 Subtext Decode</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: "What they're saying",     value: result.subtextDecode?.whatTheyAreSaying,    accent: 'var(--border)' },
                { label: "What they're NOT saying", value: result.subtextDecode?.whatTheyAreNotSaying, accent: 'rgba(166,124,82,0.3)', bg: 'rgba(200,149,108,0.05)', italic: true },
                { label: "What they need",          value: result.subtextDecode?.whatTheyNeed,         accent: 'rgba(90,122,86,0.3)', bg: 'rgba(143,175,138,0.06)' },
              ].map((col, i) => (
                <div key={i} style={{
                  padding: '15px 17px', borderRadius: 12,
                  background: col.bg || 'var(--bg-subtle)',
                  border: `1px solid ${col.accent}`,
                }}>
                  <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{col.label}</p>
                  <p style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: col.italic ? 'italic' : 'normal' }}>{col.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Move */}
          <div className="mirror-card" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <ArrowRight size={17} color="var(--caramel)" />
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--caramel)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recommended Next Move</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 18 }}>
              <span className="tag tag-caramel">📋 {result.nextMove?.recommendedAction}</span>
              <span className="tag tag-gold">⏱ {result.nextMove?.timing?.replace(/_/g, ' ')}</span>
            </div>

            {result.nextMove?.subjectLine && (
              <div style={{
                padding: '8px 14px', background: 'var(--bisque-light)',
                border: '1px solid var(--border-hover)', borderRadius: 9, marginBottom: 16,
              }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Subject: </span>
                <span style={{ fontSize: 13.5, color: 'var(--caramel)', fontWeight: 500 }}>{result.nextMove.subjectLine}</span>
              </div>
            )}

            <div style={{
              padding: '20px', background: 'rgba(255,255,255,0.7)',
              borderRadius: 14, marginBottom: 16,
              borderLeft: '3px solid var(--caramel)',
            }}>
              <p style={{ fontSize: 14.5, lineHeight: 1.85, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{result.nextMove?.message}</p>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Why this works: </strong>{result.nextMove?.reasoning}
            </p>

            <div style={{
              padding: '11px 16px', background: 'rgba(201,127,128,0.07)',
              border: '1px solid rgba(201,127,128,0.22)', borderRadius: 10, marginBottom: 16,
            }}>
              <p style={{ fontSize: 13, color: '#9B5A5B' }}>
                <strong>⚠️ Avoid: </strong>{result.nextMove?.whatToAvoid}
              </p>
            </div>

            <MessageActions
              text={result.nextMove?.message || ''}
              onSave={() => saveToHallOfFame({ module: 'Reply Decoder', sentiment: result.sentiment, text: result.nextMove?.message })}
            />
          </div>
        </div>
      )}

      {!loading && !result && (
        <EmptyState
          icon={Inbox}
          title="Paste the prospect's reply"
          description="Even a one-liner like 'Thanks, not the right time' contains layers of buying psychology. We'll decode exactly what they mean and tell you the single best next move."
        />
      )}
    </div>
  );
}
