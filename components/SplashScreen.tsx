"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const DUREE_MS = 6000;

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Évite de réafficher l'intro à chaque navigation dans la même session.
    if (typeof window !== "undefined" && sessionStorage.getItem("introVue") === "1") {
      setVisible(false);
      return;
    }
    const t1 = setTimeout(() => setFade(true), DUREE_MS - 600);
    const t2 = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem("introVue", "1");
      } catch {}
    }, DUREE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center overflow-hidden bg-black transition-opacity duration-700 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="Écran de lancement"
    >
      <div className="starfield" aria-hidden />

      <div className="crawl-perspective">
        <div className="crawl-content">
          <Image
            src="/logo.png"
            alt="Débouchage Express Var"
            width={420}
            height={420}
            priority
            className="mx-auto mb-8 w-56 max-w-[70vw] drop-shadow-[0_0_25px_rgba(8,145,178,0.6)]"
          />
          <h1 className="crawl-title">DÉBOUCHAGE EXPRESS VAR</h1>
          <p className="crawl-text">
            Intervention rapide. Débouchage de canalisations, hydrocurage et
            inspection caméra dans tout le Var.
          </p>
          <p className="crawl-text">
            Un service d&apos;urgence disponible, des techniciens équipés et un
            rapport complet avec photos avant / après.
          </p>
          <p className="crawl-text">
            Préparez votre matériel… La mission commence maintenant.
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          setFade(true);
          setTimeout(() => setVisible(false), 400);
        }}
        className="absolute bottom-6 right-6 z-10 rounded-full border border-white/30 px-4 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10"
      >
        Passer →
      </button>
    </div>
  );
}
