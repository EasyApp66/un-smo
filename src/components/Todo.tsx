import { AlertCircle } from 'lucide-react';

/** Offene Stelle im Rechtstext – deutlich sichtbar markiert. */
const Todo = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-flex items-center gap-1 align-baseline px-1.5 py-0.5 mx-0.5 rounded-[6px] border"
    style={{
      backgroundColor: 'hsl(45 93% 58% / 0.18)',
      borderColor: 'hsl(45 93% 58%)',
      color: 'hsl(35 80% 22%)',
    }}
  >
    <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
    <span className="t-14">[{children}]</span>
  </span>
);

export default Todo;
