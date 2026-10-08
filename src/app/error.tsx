"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="gate">
      <h1>Ansicht konnte nicht geladen werden.</h1>
      <p>
        Keine Aktion wurde als erfolgreich bestätigt. Bitte neu laden. Safety
        ist über den Player-Endpunkt weiterhin erreichbar.
      </p>
      <button onClick={reset}>Erneut laden</button>
      <a href="/p">Player öffnen</a>
    </main>
  );
}
