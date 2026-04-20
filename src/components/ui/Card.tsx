interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div
      className={`bg-card rounded-2xl border border-border shadow-sm ${
        padding ? "p-4" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
