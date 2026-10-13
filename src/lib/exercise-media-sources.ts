/**
 * Produz tentativas ordenadas para mídia de exercícios.
 * O FitnessProgramer pode bloquear hotlink direto em alguns navegadores/dispositivos,
 * então tentamos primeiro um proxy de imagem que preserva GIFs animados.
 */
export function getExerciseMediaSources(url: string): string[] {
  if (!url.trim()) return [];

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return [];
    const host = parsed.hostname.toLowerCase();
    const isFitnessProgramer =
      parsed.protocol === "https:" &&
      (host === "fitnessprogramer.com" || host.endsWith(".fitnessprogramer.com"));
    const proxied = isFitnessProgramer
      ? `https://wsrv.nl/?url=${encodeURIComponent(url)}&n=-1&output=gif&w=480&h=480&fit=inside&maxage=30d`
      : url;
    const alternate = (() => {
      try {
        const target = new URL(url);
        return `https://images.weserv.nl/?url=${encodeURIComponent(`${target.hostname}${target.pathname}${target.search}`)}&output=gif&w=480&h=480&fit=inside`;
      } catch {
        return url;
      }
    })();

    const candidates = isFitnessProgramer
      ? [proxied, url, alternate]
      : [url, proxied, alternate];
    return [...new Set(candidates.filter((candidate) => candidate.startsWith("https://")) )];
  } catch {
    return url.startsWith("https://") ? [url] : [];
  }
}
