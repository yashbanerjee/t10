export function SampleBadge() { return <span className="sample-badge">SAMPLE CONTENT</span>; }
export function StatusBadge({ children, live = false }: { children: React.ReactNode; live?: boolean }) { return <span className={`status-badge ${live ? "is-live" : ""}`}>{children}</span>; }

