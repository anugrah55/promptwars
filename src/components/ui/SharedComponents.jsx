import { useState } from 'react';
import { Copy, Check, RefreshCw, Star, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Copy Button ──────────────────────────────────────────────
export function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className={`btn-ghost ${className}`} title="Copy">
      {copied
        ? <><Check size={12} style={{ color: '#5A7A56' }} /> Copied!</>
        : <><Copy size={12} /> Copy</>
      }
    </button>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return (
    <div
      className={className}
      style={{
        width: size, height: size,
        border: '2px solid var(--bisque)',
        borderTop: '2px solid var(--caramel)',
        borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
      }}
    />
  );
}

// ─── Score Bar ────────────────────────────────────────────────
export function ScoreBar({ score, max = 100, label, showNumber = true }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = pct >= 75 ? '#5A7A56' : pct >= 50 ? '#A67C52' : '#9B5A5B';
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
          {showNumber && <span style={{ fontSize: 12.5, fontWeight: 700, color }}>{score}/{max}</span>}
        </div>
      )}
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────
export function SectionHeader({ icon: Icon, title, subtitle, tag, tagType = 'bisque' }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        {Icon && (
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'var(--bisque-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--border-hover)',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <Icon size={18} color="var(--caramel)" />
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Playfair Display, serif' }}>{title}</h2>
            {tag && <span className={`tag tag-${tagType}`}>{tag}</span>}
          </div>
          {subtitle && <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 3 }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Collapsible ─────────────────────────────────────────────
export function Collapsible({ title, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '15px 20px',
          background: open ? 'var(--bisque-light)' : 'var(--bg-card)',
          border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif',
          transition: 'background 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
          {badge && <span className="tag tag-bisque">{badge}</span>}
        </div>
        {open
          ? <ChevronUp size={15} color="var(--text-secondary)" />
          : <ChevronDown size={15} color="var(--text-secondary)" />
        }
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ paddingTop: 18 }}>{children}</div>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '72px 24px', textAlign: 'center',
    }}>
      {Icon && (
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: 'var(--bisque-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid var(--border-hover)',
          marginBottom: 24,
          boxShadow: 'var(--shadow-soft)',
          animation: 'float 3s ease-in-out infinite',
        }}>
          <Icon size={28} color="var(--caramel)" />
        </div>
      )}
      <h3 style={{
        fontSize: 20, fontWeight: 600, color: 'var(--text-primary)',
        fontFamily: 'Playfair Display, serif', marginBottom: 10,
      }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 380, lineHeight: 1.75 }}>{description}</p>
      {action && <div style={{ marginTop: 24 }}>{action}</div>}
    </div>
  );
}

// ─── Thinking Loader ─────────────────────────────────────────
export function ThinkingLoader({ label = 'Building psychographic model...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '56px 24px', gap: 24,
    }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          border: '2.5px solid var(--bisque)',
          borderTop: '2.5px solid var(--caramel)',
          animation: 'spin 1.1s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 10, borderRadius: '50%',
          border: '2px solid var(--wheat)',
          borderBottom: '2px solid var(--sand)',
          animation: 'spin 1.6s linear infinite reverse',
        }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: 16, fontWeight: 500, color: 'var(--text-primary)',
          fontFamily: 'Playfair Display, serif', marginBottom: 6,
        }}>{label}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>This takes a few seconds — we're thinking deeply.</p>
      </div>
    </div>
  );
}

// ─── Message Actions Bar ──────────────────────────────────────
export function MessageActions({ text, onRegenerate, onShorter, onWarmer, onDirect, onSave, showSave = true }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
      <CopyButton text={text} />
      {onRegenerate && (
        <button onClick={onRegenerate} className="btn-ghost">
          <RefreshCw size={12} /> Regenerate
        </button>
      )}
      {onShorter && <button onClick={onShorter} className="btn-ghost">↓ Shorter</button>}
      {onWarmer  && <button onClick={onWarmer}  className="btn-ghost">♥ Warmer</button>}
      {onDirect  && <button onClick={onDirect}  className="btn-ghost">→ More Direct</button>}
      {showSave && onSave && (
        <button onClick={onSave} className="btn-ghost" style={{ color: '#8B6318', borderColor: 'rgba(200,149,108,0.3)' }}>
          <Star size={12} /> Save to Hall of Fame
        </button>
      )}
    </div>
  );
}

// ─── API Key Banner ───────────────────────────────────────────
export function ApiKeyBanner() {
  return (
    <div className="api-banner" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ fontSize: 24 }}>⚡</div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#8B6318', marginBottom: 3, fontFamily: 'Playfair Display, serif' }}>Groq API Key Required</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Add{' '}
          <code style={{ background: 'rgba(200,149,108,0.15)', padding: '2px 7px', borderRadius: 5, fontSize: 12, color: 'var(--espresso)' }}>VITE_GROQ_API_KEY=gsk_...</code>
          {' '}to your{' '}
          <code style={{ background: 'rgba(200,149,108,0.15)', padding: '2px 7px', borderRadius: 5, fontSize: 12, color: 'var(--espresso)' }}>.env</code>
          {' '}file and restart. Free key at{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--caramel)', fontWeight: 600 }}>console.groq.com</a>
        </p>
      </div>
    </div>
  );
}
