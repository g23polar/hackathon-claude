interface AnalyzeButtonProps {
  fragmentCount: number;
  onAnalyze: () => void;
}

export default function AnalyzeButton({ fragmentCount, onAnalyze }: AnalyzeButtonProps) {
  const isDisabled = fragmentCount < 2;

  return (
    <button
      onClick={onAnalyze}
      disabled={isDisabled}
      style={{
        padding: '0.75rem 1.5rem',
        background: isDisabled
          ? 'rgba(139, 92, 246, 0.2)'
          : 'linear-gradient(135deg, #7C3AED, #3B82F6)',
        border: isDisabled ? '1px solid rgba(139, 92, 246, 0.3)' : 'none',
        borderRadius: '8px',
        color: isDisabled ? 'rgba(255, 255, 255, 0.4)' : '#fff',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        transition: 'all 0.2s ease',
        boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.3)',
      }}
    >
      {isDisabled
        ? `Add ${2 - fragmentCount} more fragment${2 - fragmentCount !== 1 ? 's' : ''}`
        : `Analyze ${fragmentCount} fragments`}
    </button>
  );
}
