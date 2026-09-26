import { useEffect, useState } from "react";
import type { Exercise } from "@/lib/types";

type Props = {
  exercise: Exercise;
  className?: string;
  rounded?: string;
  fit?: "cover" | "contain";
};

/**
 * Renderiza a animação em loop do exercício.
 * Se o asset não carregar, exibe um fallback animado (nunca imagem quebrada),
 * mantendo a estrutura pronta para trocar o `gif_url` depois.
 */
export function ExerciseMedia({
  exercise,
  className = "",
  rounded = "rounded-xl",
  fit = "cover",
}: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [exercise.gif_url]);

  const showFallback = failed || !exercise.gif_url;

  return (
    <div
      className={`relative overflow-hidden bg-elevated ${rounded} ${className}`}
    >
      {!showFallback && (
        <img
          src={exercise.gif_url}
          alt={`Animação de execução: ${exercise.name}`}
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-${fit} transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {(showFallback || !loaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-elevated">
          <div className="flex h-10 w-24 items-center justify-center gap-1 overflow-hidden">
            <span className="h-6 w-1.5 rounded-full bg-primary/70 animate-loop-sweep" />
            <span
              className="h-8 w-1.5 rounded-full bg-primary animate-loop-sweep"
              style={{ animationDelay: "0.15s" }}
            />
            <span
              className="h-6 w-1.5 rounded-full bg-primary/70 animate-loop-sweep"
              style={{ animationDelay: "0.3s" }}
            />
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
