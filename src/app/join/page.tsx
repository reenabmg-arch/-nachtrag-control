"use client";
import { useEffect, useRef, useState } from "react";
export default function Join() {
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = window.location.hash.slice(1);
    history.replaceState(null, "", "/join");
    if (!token) {
      setTimeout(
        () =>
          setError(
            "Kein Link-Token vorhanden. Bitte einen neuen Player-Link öffnen.",
          ),
        0,
      );
      return;
    }
    fetch("/api/player/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        location.replace("/p");
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <main className="gate">
      <span className="eyebrow">NACHTRAG</span>
      <h1>{error ? "Link nicht verfügbar" : "Zugang wird eingerichtet"}</h1>
      <p role="status">{error || "Einen Moment bitte."}</p>
    </main>
  );
}
