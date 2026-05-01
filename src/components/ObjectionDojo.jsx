import { useState, useRef } from 'react';
import { Swords, Send } from 'lucide-react';
import { callClaude } from '../lib/claude';
import { ThinkingLoader, EmptyState, ScoreBar } from './ui/SharedComponents';

const ARCHETYPES = [
  { id: 'skeptic',    emoji: '🛡️', name: 'The Skeptic',          desc: 'Has been burned before. Default answer is no.' },
  { id: 'busy',       emoji: '⏱️', name: 'The Busy Executive',    desc: 'Not hostile — genuinely has 3 minutes.' },
  { id: 'blocker',    emoji: '🧩', name: 'The Champion Blocker',  desc: 'Likes you but has a boss to convince.' },
  { id: 'price',      emoji: '💰', name: 'The Price Anchor',      desc: 'Compares you to the cheapest alternative.' },
  { id: 'status_quo', emoji: '🔒', name: 'Status Quo Defender',   desc: 'Current solution is "good enough."' },
];

function generateObjectionPrompt(product, archetype) {
  return `You are playing "${archetype.name}" — ${archetype.desc}
Product being sold: "${product}"

Generate an opening objection. Return ONLY valid JSON:
{
  "buyerName": "realistic first name",
  "openingStatement": "natural, real reaction — what they say/ask first",
  "hiddenThought": "what they're ACTUALLY thinking but not saying",
  "difficulty": 1-10
}`;
}

function generateResponseAnalysisPrompt(objection, repResponse, archetype, product) {
  return `You are a master sales coach analysing a rep's response.

BUYER: ${archetype.name} (${archetype.desc})
PRODUCT: ${product}
BUYER SAID: "${objection}"
REP RESPONDED: "${repResponse}"

Return ONLY valid JSON:
{
  "scores": {
    "empathyFirst": { "score": 0-100, "comment": "did they acknowledge before defending?" },
    "evidenceQuality": { "score": 0-100, "comment": "specific proof or vague claim?" },
    "momentumPreservation": { "score": 0-100, "comment": "did conversation advance or stall?" },
    "humanness": { "score": 0-100, "comment": "real person or scripted?" }
  },
  "overallScore": 0-100,
  "buyerRealThought": "what the buyer was ACTUALLY thinking after the rep's response",
  "whatWorked": "specific thing that landed well",
  "whatToSharpen": "specific thing to improve",
  "goldStandardResponse": "the ideal response to this exact objection from this exact buyer",
  "nextObjection": "buyer's natural follow-up",
  "nextHiddenThought": "what they're thinking behind the next objection",
  "conversationContinues": true|false
}`;
}

function generateSessionSummaryPrompt(exchanges, archetype, product) {
  const transcript = exchanges.map((e, i) => `Exchange ${i+1}:\nBuyer: "${e.objection}"\nRep: "${e.response}"\nScore: ${e.analysis?.overallScore || 0}/100`).join('\n\n');
  return `Sales coach. Review this objection handling session.

ARCHETYPE: ${archetype.name}
PRODUCT: ${product}
TRANSCRIPT:\n${transcript}

Return ONLY valid JSON:
{
  "overallScore": 0-100,
  "letterGrade": "A|B|C|D|F",
  "topStrength": "specific strength observed",
  "topWeakness": "specific weakness pattern",
  "practiceItems": ["item 1", "item 2", "item 3"],
  "archetypeInsight": "key insight for handling this archetype",
  "finalVerdict": "2-3 sentence overall assessment"
}`;
}

const GRADE_COLORS = { A: '#5A7A56', B: '#3A7A9B', C: '#8B6318', D: '#C8956C', F: '#9B5A5B' };

export default function ObjectionDojoModule() {
  const [product, setProduct] = useState('');
  const [archetype, setArchetype] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exchanges, setExchanges] = useState([]);
  const [currentBuyer, setCurrentBuyer] = useState(null);
  const [currentObjection, setCurrentObjection] = useState(null);
  const [repInput, setRepInput] = useState('');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const startSession = async () => {
    if (!product || !archetype) return;
    setLoading(true); setError(''); setExchanges([]); setSessionComplete(false); setSummary(null);
    try {
      const res = await callClaude(generateObjectionPrompt(product, archetype));
      const json = res.match(/\{[\s\S]*\}/);
      if (!json) throw new Error('Invalid response');
      const data = JSON.parse(json[0]);
      setCurrentBuyer(data.buyerName);
      setCurrentObjection({ text: data.openingStatement, hiddenThought: data.hiddenThought, difficulty: data.difficulty });
      setSessionActive(true);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const submitResponse = async () => {
    if (!repInput.trim() || !currentObjection) return;
    setLoading(true);
    const response = repInput;
    setRepInput('');
    try {
      const res = await callClaude(generateResponseAnalysisPrompt(currentObjection.text, response, archetype, product));
      const json = res.match(/\{[\s\S]*\}/);
      if (!json) throw new Error('Invalid response');
      const analysis = JSON.parse(json[0]);
      const newExchanges = [...exchanges, { objection: currentObjection.text, hiddenThought: currentObjection.hiddenThought, response, analysis }];
      setExchanges(newExchanges);

      if (!analysis.conversationContinues || newExchanges.length >= 5) {
        setSessionComplete(true);
        const sumRes = await callClaude(generateSessionSummaryPrompt(newExchanges, archetype, product));
        const sJson = sumRes.match(/\{[\s\S]*\}/);
        if (sJson) setSummary(JSON.parse(sJson[0]));
      } else {
        setCurrentObjection({ text: analysis.nextObjection, hiddenThought: analysis.nextHiddenThought, difficulty: currentObjection.difficulty });
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>

      {/* Setup */}
      {!sessionActive && (
        <div>
          <div className="glass-card" style={{ padding: 32, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                background: 'rgba(201,127,128,0.1)', border: '1.5px solid rgba(201,127,128,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Swords size={20} color="#9B5A5B" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Objection Dojo</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Roleplay with AI buyer archetypes. Get scored and coached in real-time.</p>
              </div>
            </div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 9 }}>What are you selling?</label>
            <textarea
              className="emp-input"
              rows={3}
              value={product}
              onChange={e => setProduct(e.target.value)}
              placeholder="Describe your product or service… e.g. 'An AI-powered sales intelligence platform that helps reps personalise outreach using psychographic modelling. Target buyer: VP of Sales at mid-market B2B SaaS.'"
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Choose Your Buyer Archetype</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {ARCHETYPES.map(a => {
                const isActive = archetype?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setArchetype(a)}
                    className="glass-card"
                    style={{
                      padding: 20, cursor: 'pointer',
                      borderColor: isActive ? 'rgba(201,127,128,0.5)' : 'var(--border)',
                      background: isActive ? 'rgba(201,127,128,0.07)' : '#FFFFFF',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                      <span style={{ fontSize: 26 }}>{a.emoji}</span>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Playfair Display, serif', color: isActive ? '#9B5A5B' : 'var(--text-primary)', marginBottom: 3 }}>{a.name}</p>
                        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={startSession} disabled={!product.trim() || !archetype || loading} style={{ padding: '14px 36px', fontSize: 15 }}>
              <Swords size={17} />
              {loading ? 'Preparing buyer…' : 'Start Dojo Session'}
            </button>
          </div>
          {error && <p style={{ color: '#9B5A5B', textAlign: 'center', marginTop: 16, fontSize: 13.5 }}>⚠️ {error}</p>}
        </div>
      )}

      {/* Active Session */}
      {sessionActive && !sessionComplete && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{archetype.emoji}</span>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>{currentBuyer} — {archetype.name}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{product.slice(0, 60)}…</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
              <span className="tag tag-bisque">Round {exchanges.length + 1}/5</span>
              <button onClick={() => { setSessionActive(false); setArchetype(null); }} className="btn-ghost">End Session</button>
            </div>
          </div>

          {/* Conversation */}
          <div style={{ marginBottom: 24 }}>
            {exchanges.map((ex, i) => (
              <div key={i} className="animate-fade-up" style={{ marginBottom: 24 }}>
                <div className="objection-bubble">
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>{archetype.emoji} {currentBuyer} said:</p>
                  <p style={{ fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.7 }}>{ex.objection}</p>
                  <p style={{ fontSize: 12, color: '#9B5A5B', marginTop: 7, fontStyle: 'italic' }}>💭 "{ex.hiddenThought}"</p>
                </div>
                <div className="response-bubble">
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>You said:</p>
                  <p style={{ fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.7 }}>{ex.response}</p>
                </div>

                {ex.analysis && (
                  <div style={{
                    padding: 20, borderRadius: 14, border: '1.5px solid var(--border)',
                    background: 'var(--bg-subtle)', marginBottom: 6,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--caramel)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coach's Analysis</span>
                      <div style={{
                        padding: '4px 13px', borderRadius: 20,
                        background: ex.analysis.overallScore >= 75 ? 'rgba(90,122,86,0.12)' : ex.analysis.overallScore >= 50 ? 'rgba(212,169,106,0.15)' : 'rgba(201,127,128,0.12)',
                        color: ex.analysis.overallScore >= 75 ? '#5A7A56' : ex.analysis.overallScore >= 50 ? '#8B6318' : '#9B5A5B',
                        fontSize: 14.5, fontWeight: 700, fontFamily: 'Playfair Display, serif',
                      }}>{ex.analysis.overallScore}/100</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      {Object.entries(ex.analysis.scores || {}).map(([key, val]) => (
                        <div key={key}>
                          <ScoreBar score={val.score} label={key.replace(/([A-Z])/g, ' $1').trim()} />
                          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>{val.comment}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div style={{ padding: '11px 14px', background: 'rgba(90,122,86,0.07)', borderRadius: 10, border: '1px solid rgba(90,122,86,0.18)' }}>
                        <p style={{ fontSize: 11, color: '#5A7A56', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✓ What Worked</p>
                        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ex.analysis.whatWorked}</p>
                      </div>
                      <div style={{ padding: '11px 14px', background: 'rgba(212,169,106,0.08)', borderRadius: 10, border: '1px solid rgba(212,169,106,0.2)' }}>
                        <p style={{ fontSize: 11, color: '#8B6318', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚡ Sharpen This</p>
                        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ex.analysis.whatToSharpen}</p>
                      </div>
                    </div>

                    <div style={{ padding: '12px 15px', background: 'var(--bisque-light)', borderRadius: 10, border: '1.5px solid var(--border-hover)' }}>
                      <p style={{ fontSize: 11, color: 'var(--caramel)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🏆 Gold Standard Response</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'Playfair Display, serif' }}>"{ex.analysis.goldStandardResponse}"</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Objection */}
          {currentObjection && (
            <div className="animate-fade-up">
              <div className="objection-bubble" style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 7 }}>
                  {archetype.emoji} {currentBuyer} says:
                  <span className="tag tag-rose" style={{ marginLeft: 10 }}>Difficulty {currentObjection.difficulty}/10</span>
                </p>
                <p style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500 }}>{currentObjection.text}</p>
              </div>
              <div className="chat-area">
                <textarea
                  className="emp-input"
                  rows={4}
                  value={repInput}
                  onChange={e => setRepInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) submitResponse(); }}
                  placeholder="Type your response… (⌘ + Enter to submit)"
                  disabled={loading}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn-primary" onClick={submitResponse} disabled={!repInput.trim() || loading}>
                    <Send size={14} />{loading ? 'Analysing…' : 'Submit Response'}
                  </button>
                </div>
              </div>
              {loading && <div style={{ marginTop: 16 }}><ThinkingLoader label="Scoring your response…" /></div>}
            </div>
          )}
        </div>
      )}

      {/* Session Complete */}
      {sessionComplete && summary && (
        <div className="animate-fade-up">
          <div className="mirror-card" style={{ marginBottom: 24, textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 52, marginBottom: 18 }}>🎯</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Session Complete</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>{archetype.name} · {exchanges.length} exchanges</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 20,
              padding: '22px 36px', borderRadius: 18,
              background: `${GRADE_COLORS[summary.letterGrade] || 'var(--caramel)'}10`,
              border: `2px solid ${GRADE_COLORS[summary.letterGrade] || 'var(--caramel)'}40`,
            }}>
              <div style={{ fontSize: 52, fontWeight: 700, color: GRADE_COLORS[summary.letterGrade], fontFamily: 'Playfair Display, serif' }}>{summary.letterGrade}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: GRADE_COLORS[summary.letterGrade], fontFamily: 'Playfair Display, serif' }}>{summary.overallScore}/100</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Overall Score</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div className="glass-card" style={{ padding: 22 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#5A7A56', marginBottom: 9, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Top Strength</p>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>{summary.topStrength}</p>
            </div>
            <div className="glass-card" style={{ padding: 22 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9B5A5B', marginBottom: 9, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Top Weakness</p>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>{summary.topWeakness}</p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--caramel)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.07em' }}>3 Things To Practice Next Time</p>
            {summary.practiceItems?.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: 'var(--bisque-light)', border: '1px solid var(--border-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12.5, fontWeight: 700, color: 'var(--caramel)',
                }}>{i + 1}</div>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>{item}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
            <button className="btn-primary" onClick={() => { setSessionActive(false); setSessionComplete(false); setArchetype(null); setProduct(''); }}>
              <Swords size={16} /> Start New Session
            </button>
          </div>
        </div>
      )}

      {!sessionActive && !loading && (
        <EmptyState
          icon={Swords}
          title="Choose your sparring partner"
          description="Select a buyer archetype and describe what you're selling. The AI will play a real buyer and coach you through each objection in real-time."
        />
      )}
    </div>
  );
}
