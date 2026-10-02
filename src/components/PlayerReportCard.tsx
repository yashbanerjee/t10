import { calculatePlayerReport, type PlayerPerformanceInput } from "@/lib/performance";

const labels = ["Batting impact", "Bowling impact", "Fielding impact"] as const;
export function PlayerReportCard({ stats }: { stats: PlayerPerformanceInput | null }) {
  const report = stats ? calculatePlayerReport(stats) : null;
  return <div className="report-card"><div className="report-card-top"><div><span className="eyebrow"><i className="eyebrow-dot" />SCORECARD MODEL</span><h3>PLAYER<br />REPORT.</h3></div><strong className="report-score">{report ? report.overall : "—"}<small> / 100</small></strong></div>
    {report ? <div className="report-metrics">{labels.map((label, index) => { const value = [report.batting, report.bowling, report.fielding][index]; return <div className="report-metric" key={label}><span>{label}</span><div className="report-track" aria-label={`${label}: ${value ?? "not available"}`}>{value !== null && <i style={{ width: `${value}%` }} />}</div><strong>{value ?? "—"}</strong></div>; })}</div> : <p>Index appears after a verified batting, bowling or fielding scorecard is entered.</p>}
    <p className="report-disclaimer">Club-only indicator calculated from official scorecard totals. It is not an official league rating.</p>
  </div>;
}
