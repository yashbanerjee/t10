export function LightTrail({ edge }: { edge: "top" | "bottom" }) {
  return <span className={`light-trail is-${edge}`} aria-hidden="true"><i /><i /></span>;
}
