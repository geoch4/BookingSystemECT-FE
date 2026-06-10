export default function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Laddar"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2.5px solid var(--border)',
        borderTopColor: 'var(--ect-color)',
        animation: 'spin 0.65s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}
