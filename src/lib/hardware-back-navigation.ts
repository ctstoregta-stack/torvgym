const PROFILE_CHILD_ROUTES = new Set([
  "/configuracoes",
  "/conquistas",
  "/progresso",
  "/relatorios",
]);

/** Returns the in-app parent destination for Android's hardware Back action. */
export function getHardwareBackTarget(pathname: string): string | null {
  let path = pathname.split("?")[0] || "/";
  while (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 2 && segments[0] === "exercicio") return "/exercicios";
  if (path === "/exercicios" || path === "/historico") return "/perfil";
  if (PROFILE_CHILD_ROUTES.has(path)) return "/perfil";

  if (segments.length === 2 && segments[0] === "executar") return `/treino/${segments[1]}`;
  if (segments.length === 2 && segments[0] === "treino") return "/rotinas";
  if (path === "/rotinas" || path === "/perfil") return "/";

  // On the home screen, keep the app open instead of letting Back exit it.
  return null;
}
