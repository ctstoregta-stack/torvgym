const PROFILE_CHILD_ROUTES = new Set([
  "/configuracoes",
  "/conquistas",
  "/corpo",
  "/historico",
  "/exercicios",
  "/progresso",
]);

/** Shared destination for Android's hardware Back and the in-app Back button. */
export function getHardwareBackTarget(pathname: string): string | null {
  let path = pathname.split("?")[0] || "/";
  while (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 2 && segments[0] === "exercicio") return "/exercicios";
  if (PROFILE_CHILD_ROUTES.has(path)) return "/perfil";
  if (path === "/relatorios") return "/historico";

  if (segments.length === 2 && segments[0] === "executar") return `/treino/${segments[1]}`;
  if (segments.length === 2 && segments[0] === "treino") return "/rotinas";
  if (path === "/rotinas" || path === "/perfil") return "/";

  // Home is the root: Back must keep TorvGym open rather than exit the app.
  return null;
}