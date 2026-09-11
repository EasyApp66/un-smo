interface MarkProps {
  size?: number;
  className?: string;
}

/** Offener Ring – das Zeichen der App. Nimmt die Farbe des Elternelements an. */
const Mark = ({ size = 28, className = '' }: MarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    role="img"
    aria-label="UN-SMO"
    className={className}
  >
    <path
      d="M163.5 95.8 A185 185 0 1 0 348.5 95.8"
      stroke="currentColor"
      strokeWidth={69}
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export default Mark;
