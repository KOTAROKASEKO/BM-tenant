"use client";

import { useEffect, useRef, useState } from "react";
import { DotLottie } from "@lottiefiles/dotlottie-web";

export default function LifeSimulatorLottie() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<DotLottie | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const url = `${window.location.origin}/life_simulator.json`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        return res.json();
      })
      .then((data: Record<string, unknown>) => {
        instanceRef.current = new DotLottie({
          canvas,
          data,
          autoplay: true,
          loop: true,
        });
      })
      .catch((err) => {
        console.error("Lottie load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load animation");
      });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[200px] w-full max-w-[280px] mx-auto items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 text-sm">
        Animation unavailable
      </div>
    );
  }

  return (
    <div className="mx-auto h-[240px] w-full max-w-[280px] overflow-hidden">
      <canvas
        ref={canvasRef}
        id="dotlottie-canvas"
        className="w-full h-full"
        style={{ width: "100%", height: "240px" }}
        width={280}
        height={240}
      />
    </div>
  );
}
