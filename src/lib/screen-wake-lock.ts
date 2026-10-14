/**
 * Mantém a tela acesa enquanto o treino está em andamento.
 * Usa a Screen Wake Lock API quando disponível; caso contrário, não faz nada.
 * Retorna uma função que libera o bloqueio e remove os listeners.
 */
export function keepScreenAwake(): () => void {
  if (typeof navigator === "undefined" || typeof document === "undefined") return () => {};
  if (!("wakeLock" in navigator) || !navigator.wakeLock) return () => {};

  let sentinel: WakeLockSentinel | null = null;
  let stopped = false;
  let requesting = false;

  const request = async () => {
    if (stopped || requesting || sentinel || document.visibilityState !== "visible") return;
    requesting = true;
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (stopped) {
        await lock.release().catch(() => {});
        return;
      }
      sentinel = lock;
      lock.addEventListener("release", () => {
        if (sentinel === lock) sentinel = null;
      });
    } catch {
      // Sem permissão, economia de bateria ou API indisponível: o treino segue normal.
      sentinel = null;
    } finally {
      requesting = false;
    }
  };

  // O sistema libera o bloqueio ao ocultar a página; pedimos de novo ao voltar.
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") void request();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  void request();

  return () => {
    stopped = true;
    document.removeEventListener("visibilitychange", onVisibilityChange);
    const current = sentinel;
    sentinel = null;
    if (current) void current.release().catch(() => {});
  };
}
