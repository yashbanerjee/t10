"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-page"><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS</span><h1>THAT PLAY<br />DIDN’T LAND.</h1><p>Something went wrong while loading this page. Try again in a moment.</p><button className="button button-primary" onClick={() => reset()}>TRY AGAIN</button></main>;
}
