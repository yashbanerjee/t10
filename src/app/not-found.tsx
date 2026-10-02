import Link from "next/link";

export default function NotFound() {
  return <main className="error-page"><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS</span><h1>NO PLAY<br />HERE.</h1><p>That page isn’t in the fixture. The link may have moved.</p><Link className="button button-primary" href="/">BACK TO HOME</Link></main>;
}
