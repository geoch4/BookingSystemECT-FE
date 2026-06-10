import { useEffect, useRef, useState } from 'react';

interface CancelBookingDialogProps {
  patientName: string;
  time: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function CancelBookingDialog({ patientName, time, onConfirm, onCancel }: CancelBookingDialogProps) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(23,32,51,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%', maxWidth: 420,
          padding: '24px 24px 20px',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
      >
        <h2
          id="cancel-dialog-title"
          style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 750, color: 'var(--text-main)' }}
        >
          Avboka patient
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Avboka <strong style={{ color: 'var(--text-main)' }}>{patientName}</strong> klockan {time}? Slotten blir då ledig.
        </p>

        <label
          htmlFor="cancel-reason"
          style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}
        >
          Avbokningsorsak <span style={{ fontWeight: 400, color: 'var(--text-subtle)' }}>(valfritt)</span>
        </label>
        <textarea
          id="cancel-reason"
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="T.ex. Patienten avböjde, felbokning, sjukdom..."
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '8px 10px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            fontSize: 13, color: 'var(--text-main)',
            background: 'var(--surface-soft)',
            resize: 'vertical', lineHeight: 1.45,
            outline: 'none', marginBottom: 18,
            fontFamily: 'var(--font-ui)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ect-color)'; e.currentTarget.style.background = '#fff'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-soft)'; }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'transparent',
              fontSize: 13.5, fontWeight: 600, color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Behåll
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)',
              background: '#D4860A', color: '#fff', border: 'none',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Avboka
          </button>
        </div>
      </div>
    </div>
  );
}
