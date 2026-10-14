const PROFILE_CHILD_ROUTES = new Set(["/configuracoes", "/conquistas", "/progresso", "/relatorios"]);

/** Returns the in-app parent destination for Android's hardware Back action. */
export function getHardwareBackTarget(pathname: string): string | null {
  const path = pathname.split("?")[0]?.replace(/\\/+$/, "") || "/";

  if (/^\\/exercicio\\/[^/]+$/.test(path)) return "/exercicios";
  if (path === "/exercicios" || path === "/historico") return "/perfil";
  if (PROFILE_CHILD_ROUTES.has(path)) return "/perfil";

  const activeWorkout = path.match(/^\\/executar\\/([^/]+)$/);
  if (activeWorkout) return `/treino/${activeWorkout[1]}`;
  if (/^\\/treino\\/[^/]+$/.test(path)) return "/rotinas";
  if (path === "/rotinas" || path === "/perfil") return "/";

  // On the home screen, keep the app open instead of letting Back exit it.
  return null;
}
