import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { Exercise } from "@/lib/types";

type Props = {
  exercise: Exercise;
  className?: string;
  rounded?: string;
  fit?: "cover" | "contain";
  loading?: "lazy" | "eager";
};

function proxiedGifUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (
      parsed.protocol !== "https:" ||
      (host !== "fitnessprogramer.com" && !host.endsWith(".fitnessprogramer.com"))
    ) {
      return url;
    }
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&n=-1&output=gif&w=480&h=480&fit=inside&maxage=30d`;
  } catch {
    return url;
  }
}

export const ExerciseMedia = memo(function ExerciseMedia({
  exercise,
  className = "",
  rounded = "rounded-xl",
  fit = "cover",
  loading = "lazy",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(loading === "eager");
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  // Começa otimista para manter SSR/hidratação estáveis; o efeito sincroniza o estado real.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setFailed(false);
      setLoaded(false);
      setUseProxy(false);
    };
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    setUseProxy(false);
    if (loading === "eager") {
      setVisible(true);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [exercise.gif_url, loading]);

  const sourceUrl = useMemo(() => {
    if (!exercise.gif_url) return "";
    return useProxy ? proxiedGifUrl(exercise.gif_url) : exercise.gif_url;
  }, [exercise.gif_url, useProxy]);

  const showFallback = failed || !exercise.gif_url || !online;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-elevated ${rounded} ${className}`}
    >
      {visible && !showFallback && (
        <img
          src={sourceUrl}
          alt={`Animação de execução: ${exercise.name}`}
          loading={loading}
          decoding="async"
          fetchPriority={loading === "eager" ? "high" : "low"}
          referrerPolicy="no-referrer"
          onError={() => {
            if (!useProxy) {
              setUseProxy(true);
              setLoaded(false);
            } else {
              setFailed(true);
            }
          }}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {(showFallback || (visible && !loaded)) && (
        <div
          role={showFallback ? "status" : undefined}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-elevated"
        >
          <div className="flex h-10 w-24 items-center justify-center gap-1 overflow-hidden">
            <span className="h-6 w-1.5 rounded-full bg-primary/70 animate-loop-sweep" />
            <span className="h-8 w-1.5 rounded-full bg-primary animate-loop-sweep" style={{ animationDelay: "0.15s" }} />
            <span className="h-6 w-1.5 rounded-full bg-primary/70 animate-loop-sweep" style={{ animationDelay: "0.3s" }} />
          </div>
          {showFallback && (
            <p className="px-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
              Animação indisponível
            </p>
          )}
          {failed && online && exercise.gif_url && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setFailed(false);
                setLoaded(false);
                setUseProxy(false);
              }}
              className="min-h-9 rounded-full bg-primary/15 px-3 text-[11px] font-semibold text-primary tap active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}
    </div>
  );
});
