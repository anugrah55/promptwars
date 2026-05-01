import { useApp } from './context/AppContext';
import ProspectMirror from './components/ProspectMirror';
import MessageHumanizer from './components/MessageHumanizer';
import ObjectionDojo from './components/ObjectionDojo';
import FollowUpStrategist from './components/FollowUpStrategist';
import ReplyDecoder from './components/ReplyDecoder';
import HallOfFame from './components/HallOfFame';
import { Brain, Edit3, Swords, Clock, Inbox, Star, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'mirror',   icon: Brain,   label: 'Prospect Mirror',      tag: '01' },
  { id: 'humanizer',icon: Edit3,   label: 'Message Humanizer',    tag: '02' },
  { id: 'dojo',     icon: Swords,  label: 'Objection Dojo',       tag: '03' },
  { id: 'followup', icon: Clock,   label: 'Follow-Up Strategist', tag: '04' },
  { id: 'decoder',  icon: Inbox,   label: 'Reply Decoder',        tag: '05' },
  { id: 'hof',      icon: Star,    label: 'Hall of Fame',         tag: '★' },
];

const MODULE_MAP = {
  mirror:    ProspectMirror,
  humanizer: MessageHumanizer,
  dojo:      ObjectionDojo,
  followup:  FollowUpStrategist,
  decoder:   ReplyDecoder,
  hof:       HallOfFame,
};

function ActiveMirrorBadge({ mirror }) {
  if (!mirror) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFF1E0 0%, #FFECD4 100%)',
      border: '1.5px solid rgba(200,149,108,0.35)',
      borderRadius: 14,
      padding: '12px 16px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#8FAF8A',
          boxShadow: '0 0 0 3px rgba(143,175,138,0.25)',
          flexShrink: 0,
        }} />
        <p style={{ fontSize: 10, color: '#A08070', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Active Mirror</p>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#3D2B1F', fontFamily: 'Playfair Display, serif', marginBottom: 2 }}>{mirror.name}</p>
      <p style={{ fontSize: 12, color: '#6B4C3B' }}>{mirror.title}</p>
    </div>
  );
}

export default function App() {
  const { activeModule, setActiveModule, prospectMirror, hallOfFame } = useApp();
  const ActiveComponent = MODULE_MAP[activeModule] || ProspectMirror;
  const hasApiKey = !!import.meta.env.VITE_GROQ_API_KEY;
  const activeItem = NAV_ITEMS.find(n => n.id === activeModule);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Sidebar ──────────────────────────────── */}
      <aside style={{
        width: 256,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'linear-gradient(180deg, #FFFCF8 0%, #FFF8F0 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 16px 24px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>

        {/* Logo */}
        <div style={{ padding: '0 6px', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'linear-gradient(135deg, #C8956C 0%, #A67C52 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(168,120,80,0.28)',
              animation: 'pulse-warm 3s ease infinite',
            }}>
              <Sparkles size={17} color="#FFF8F2" />
            </div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: '#2C1810', letterSpacing: '-0.02em' }}>
                Empathy Engine
              </h1>
              <p style={{ fontSize: 10.5, color: '#A08070', letterSpacing: '0.09em', textTransform: 'uppercase', fontWeight: 500 }}>Sales Intelligence</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#A08070', lineHeight: 1.6, paddingLeft: 49 }}>
            Think in psychology, not data fields.
          </p>
        </div>

        {/* Active Mirror */}
        <ActiveMirrorBadge mirror={prospectMirror} />

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          <p style={{ fontSize: 10, color: '#C4A898', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, paddingLeft: 6, fontWeight: 600 }}>Modules</p>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            const needsMirror = ['humanizer', 'followup', 'decoder'].includes(item.id) && !prospectMirror;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`nav-tab ${isActive ? 'active' : ''}`}
                style={{ marginBottom: 3, justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon size={14} color={isActive ? '#5C3D2E' : '#A08070'} />
                  <span>{item.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {needsMirror && (
                    <span style={{ fontSize: 9, color: '#C4A898', background: 'rgba(200,149,108,0.12)', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>needs mirror</span>
                  )}
                  {item.id === 'hof' && hallOfFame.length > 0 && (
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 9,
                      background: 'var(--bisque-deep)', color: 'var(--espresso)',
                      fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 5px',
                    }}>{hallOfFame.length}</span>
                  )}
                  <span style={{ fontSize: 10.5, color: isActive ? '#A08070' : '#C4A898', fontWeight: 600 }}>{item.tag}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ paddingTop: 20, borderTop: '1px solid var(--border)', marginTop: 8 }}>
          <p style={{ fontSize: 11.5, color: '#A08070', lineHeight: 1.7 }}>
            Powered by{' '}
            <span style={{ color: '#8B6355', fontWeight: 600 }}>Claude Sonnet</span><br />
            <span style={{ fontSize: 10.5 }}>Psychographic modeling · Empathy-first AI</span>
          </p>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>

        {/* Topbar */}
        <div style={{
          padding: '20px 48px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,252,248,0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeItem && (() => {
              const Icon = activeItem.icon;
              return (
                <>
                  <Icon size={17} color="var(--caramel)" />
                  <h2 style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: 18, fontWeight: 600, color: 'var(--text-primary)',
                  }}>{activeItem.label}</h2>
                  <ChevronRight size={14} color="var(--text-light)" />
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--caramel)',
                    background: 'var(--bisque-light)', border: '1px solid var(--border-hover)',
                    padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em',
                  }}>{activeItem.tag}</span>
                </>
              );
            })()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!hasApiKey && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 13px',
                background: 'rgba(200,149,108,0.1)',
                border: '1px solid rgba(200,149,108,0.3)',
                borderRadius: 9, fontSize: 12.5, color: '#8B6318',
              }}>
                <AlertCircle size={13} /> Add API key in .env
              </div>
            )}
            {prospectMirror && (
              <button
                onClick={() => setActiveModule('mirror')}
                className="btn-ghost"
                style={{ fontSize: 12.5 }}
              >
                <Brain size={12} color="var(--caramel)" />
                <span style={{ color: 'var(--walnut)' }}>View Mirror</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '48px' }}>
          {!hasApiKey && (
            <div className="api-banner" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
              <div style={{ fontSize: 26, flexShrink: 0 }}>⚡</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#8B6318', marginBottom: 3, fontFamily: 'Playfair Display, serif' }}>Claude API Key Required</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Add{' '}
                  <code style={{ background: 'rgba(200,149,108,0.15)', padding: '2px 7px', borderRadius: 5, fontSize: 12, color: 'var(--espresso)' }}>VITE_ANTHROPIC_API_KEY=sk-ant-…</code>
                  {' '}to your{' '}
                  <code style={{ background: 'rgba(200,149,108,0.15)', padding: '2px 7px', borderRadius: 5, fontSize: 12, color: 'var(--espresso)' }}>.env</code>
                  {' '}file and restart the dev server.
                </p>
              </div>
            </div>
          )}
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}
