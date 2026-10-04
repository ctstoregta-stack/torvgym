import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card } from "@/components/ui-kit";
import { useGym } from "@/store/gym-store";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações · TorvGym" },
      {
        name: "description",
        content: "Backup, restauração e segurança dos seus dados do TorvGym.",
      },
    ],
  }),
  component: Settings,
});

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function Settings() {
  const { ready, state, createBackup, importBackup, storageSizeBytes, createEncryptedSyncPackage, importEncryptedSyncPackage } = useGym();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [syncPassword, setSyncPassword] = useState("");
  const [syncInput, setSyncInput] = useState<HTMLInputElement | null>(null);

  function handleExport() {
    try {
      const backup = createBackup();
      const blob = new Blob([backup], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `torvgym-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Backup exportado com sucesso.");
    } catch {
      toast.error("Não foi possível criar o backup.");
    }
  }

  async function handleImport(file: File) {
    setBusy(true);
    try {
      const raw = await file.text();
      if (state.activeSession && !window.confirm("Existe um treino em andamento. Restaurar o backup substituirá esse estado. Continuar?")) {
        return;
      }

      const result = importBackup(raw);
      if (result === "saved") {
        toast.success("Backup restaurado com sucesso.");
      } else if (result === "memory-only") {
        toast.warning("Backup restaurado em memória, mas o armazenamento local está cheio ou indisponível.");
      } else {
        toast.error("Esse arquivo não é um backup válido do TorvGym.");
      }
    } catch {
      toast.error("Não foi possível ler o arquivo de backup.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleSyncExport() {
    if (syncPassword.length < 8) {
      toast.error("Use uma senha de pelo menos 12 caracteres para proteger a sincronização.");
      return;
    }
    try {
      const raw = await createEncryptedSyncPackage(syncPassword);
      const blob = new Blob([raw], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `torvgym-sync-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Pacote de sincronização protegido exportado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o pacote.");
    }
  }

  async function handleSyncImport(file: File) {
    if (syncPassword.length < 8) {
      toast.error("Informe a senha usada para proteger o pacote.");
      return;
    }
    setBusy(true);
    try {
      const raw = await file.text();
      if (state.activeSession && !window.confirm("Existe um treino em andamento. Restaurar a sincronização substituirá esse estado. Continuar?")) return;
      const result = await importEncryptedSyncPackage(raw, syncPassword);
      toast[result === "saved" ? "success" : "warning"](
        result === "saved" ? "Dados E2EE sincronizados neste dispositivo." : "Dados sincronizados em memória, mas não puderam ser gravados no armazenamento local.",
      );
    } catch {
      toast.error("Não foi possível abrir o pacote. Verifique a senha e o arquivo.");
    } finally {
      setBusy(false);
      if (syncInput) syncInput.value = "";
    }
  }

  if (!ready) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }

  const finishedSessions = state.sessions.filter((session) => session.finishedAt).length;

  return (
    <AppShell>
      <div className="mb-6">
        <Link to="/" className="text-xs font-semibold text-primary">← Início</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Proteja seu histórico e mantenha uma cópia dos dados do TorvGym.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Backup dos dados</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Exporta rotinas, treinos, exercícios personalizados, histórico e sessão em andamento.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-elevated px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {finishedSessions} treino{finishedSessions === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleExport}>Exportar backup</Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? "Restaurando…" : "Restaurar backup"}
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
            }}
          />
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Sincronização E2EE</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Gere um pacote com criptografia de ponta a ponta. Os dados são criptografados neste dispositivo antes de serem exportados; quem armazenar o arquivo não consegue ler o conteúdo sem a senha. O TorvGym continua funcionando offline e não envia seus dados para um servidor sem uma configuração de nuvem explícita.
          </p>
          <label className="mt-4 block text-xs font-semibold text-muted-foreground">
            Senha de sincronização
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              value={syncPassword}
              onChange={(event) => setSyncPassword(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              className="mt-1 h-11 w-full rounded-lg border border-border bg-elevated px-3 text-sm font-normal text-foreground"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => void handleSyncExport()}>Exportar pacote E2EE</Button>
            <Button variant="outline" disabled={busy} onClick={() => syncInput?.click()}>
              {busy ? "Sincronizando…" : "Importar pacote"}
            </Button>
          </div>
          <input
            ref={setSyncInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleSyncImport(file);
            }}
          />
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Armazenamento local</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O TorvGym mantém seus dados localmente neste dispositivo.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-elevated p-3">
              <p className="text-xs text-muted-foreground">Dados salvos</p>
              <p className="mt-1 text-lg font-semibold">{formatBytes(storageSizeBytes())}</p>
            </div>
            <div className="rounded-lg bg-elevated p-3">
              <p className="text-xs text-muted-foreground">Rotinas</p>
              <p className="mt-1 text-lg font-semibold">{state.routines.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Segurança dos dados</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            O backup é validado antes de ser restaurado. Mantenha uma cópia fora do aparelho para reduzir o risco de perda após desinstalação ou limpeza dos dados do aplicativo.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
