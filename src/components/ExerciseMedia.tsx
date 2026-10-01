import { useEffect, useMemo, useRef, useState } from "react";
import type { Exercise } from "@/lib/types";

type Props = {
  exercise: Exercise;
  className?: string;
  rounded?: string;
  fit?: "cover" | "contain";
  loading?: "lazy" | "eager";
};

function proxiedGifUrl(url: string) {
  if (!/^https?:\/\//i.test(url) || url.includes("wsrv.nl")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&n=-1&output=gif&w=480&h=480&fit=inside&maxage=30d`;
}

export function ExerciseMedia({
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
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);

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
      { rootMargin: "120px 0px" },
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-elevated">
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
        </div>
      )}
    </div>
  );
}
