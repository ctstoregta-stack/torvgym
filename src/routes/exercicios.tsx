import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { Button, Card, Input } from "@/components/ui-kit";
import { useGym } from "@/store/gym-store";

export const Route = createFileRoute("/exercicios")({
  head: () => ({
    meta: [
      { title: "Exercícios · TorvGym" },
      {
        name: "description",
        content:
          "Biblioteca de exercícios com animação em loop, execução e músculos trabalhados.",
      },
      { property: "og:title", content: "Biblioteca de Exercícios · TorvGym" },
      {
        property: "og:description",
        content: "Animações em loop, instruções e ativação muscular de cada exercício.",
      },
    ],
  }),
  component: ExercisesPage,
});

function ExercisesPage() {
  const { ready, exercises, addCustomExercise, prFor } = useGym();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(60);
  const [form, setForm] = useState({
    name: "",
    category: "",
    equipment: "",
    gif_url: "",
    execution: "",
    primary: "",
    secondary: "",
  });

  const categories = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.category))).sort(),
    [exercises],
  );

  const filtered = useMemo(
    () =>
      exercises.filter(
        (e) =>
          (!category || e.category === category) &&
          `${e.name} ${e.equipment}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [exercises, query, category],
  );

  if (!ready) {
    return (
      <AppShell title="Exercícios">
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Exercícios">
      <Input
        placeholder="Buscar exercício"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          onClick={() => setCategory(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
            category === null ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
          }`}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              category === c ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {visibleExercises.map((ex) => {
          const pr = prFor(ex.id);
          return (
            <Link key={ex.id} to="/exercicio/$exerciseId" params={{ exerciseId: ex.id }}>
              <div className="surface flex items-center gap-3 p-3 tap active:scale-[0.99]">
                <ExerciseMedia exercise={ex} className="h-16 w-16 shrink-0" rounded="rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.category} · {ex.equipment}
                  </p>
                  {pr != null && (
                    <p className="mt-0.5 text-xs font-semibold text-gold">PR {pr} kg</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length > visibleLimit && (\n          <Button\n            variant="secondary"\n            className="w-full"\n            onClick={() => setVisibleLimit((limit) => limit + 60)}\n          >\n            Mostrar mais {Math.min(60, filtered.length - visibleLimit)}\n          </Button>\n        )}\n        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum exercício encontrado.
          </p>
        )}
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Criar exercício</p>
          <button
            className="text-xs font-semibold text-primary"
            onClick={() => setCreating((v) => !v)}
          >
            {creating ? "Cancelar" : "Abrir"}
          </button>
        </div>
        {creating && (
          <div className="mt-3 space-y-2">
            <Input
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Grupo muscular (ex.: Peito)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              placeholder="Equipamento"
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            />
            <Input
              placeholder="URL do GIF (animação em loop)"
              value={form.gif_url}
              onChange={(e) => setForm({ ...form, gif_url: e.target.value })}
            />
            <Input
              placeholder="Instruções de execução"
              value={form.execution}
              onChange={(e) => setForm({ ...form, execution: e.target.value })}
            />
            <Input
              placeholder="Músculos primários (separados por vírgula)"
              value={form.primary}
              onChange={(e) => setForm({ ...form, primary: e.target.value })}
            />
            <Input
              placeholder="Músculos secundários (separados por vírgula)"
              value={form.secondary}
              onChange={(e) => setForm({ ...form, secondary: e.target.value })}
            />
            <Button
              className="w-full"
              disabled={!form.name.trim() || !form.category.trim()}
              onClick={() => {
                const split = (v: string) =>
                  v.split(",").map((s) => s.trim()).filter(Boolean);
                addCustomExercise({
                  id: `custom-${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
                  name: form.name.trim(),
                  category: form.category.trim(),
                  equipment: form.equipment.trim() || "Livre",
                  gif_url: form.gif_url.trim(),
                  execution: form.execution.trim(),
                  primary_muscles: split(form.primary),
                  secondary_muscles: split(form.secondary),
                });
                setForm({
                  name: "",
                  category: "",
                  equipment: "",
                  gif_url: "",
                  execution: "",
                  primary: "",
                  secondary: "",
                });
                setCreating(false);
              }}
            >
              Salvar exercício
            </Button>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
