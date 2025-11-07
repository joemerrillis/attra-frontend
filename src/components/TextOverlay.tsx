interface TextOverlayProps {
  text: string;
  style: React.CSSProperties;
}

export function TextOverlay({ text, style }: TextOverlayProps) {
  if (!text) return null;

  return (
    <div
      style={{
        position: 'absolute',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 120px',
        wordWrap: 'break-word',
        textAlign: 'center',
        ...style,
      }}
    >
      {text}
    </div>
  );
}
