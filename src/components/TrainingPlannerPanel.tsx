import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui-kit";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { buildTrainingPlan, type Access, type Goal, type Level } from "@/lib/training-planner";
import { useGym } from "@/store/gym-store";

const goals: { value: Goal; label: string }[] = [
  { value: "hypertrophy", label: "Hipertrofia" },
  { value: "strength", label: "Força" },
  { value: "conditioning", label: "Resistência muscular" },
  { value: "general", label: "Condicionamento geral" },
];
const levels: { value: Level; label: string }[] = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
];
const equipmentOptions: { value: Access; label: string; description: string }[] = [
  { value: "gym", label: "Academia completa", description: "Máquinas, polias, barras e halteres" },
  { value: "home", label: "Casa com halteres", description: "Halteres, banco, caneleiras e peso corporal" },
  { value: "bodyweight", label: "Peso corporal", description: "Sem aparelhos ou pesos externos" },
];
const muscleOptions = ["Peitoral", "Costas", "Quadríceps", "Glúteos", "Ombros", "Bíceps", "Tríceps", "Abdômen"];
const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function TrainingPlannerPanel() {
  const { exercises, createRoutine, createWorkout, updateWorkout } = useGym();
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState<Goal>("hypertrophy");
  const [level, setLevel] = useState<Level>("intermediate");
  const [frequency, setFrequency] = useState(4);
  const [minutes, setMinutes] = useState(60);
  const [equipment, setEquipment] = useState<Access>("gym");
  const [priorityMuscles, setPriorityMuscles] = useState<string[]>([]);
  const [name, setName] = useState("Plano personalizado · Hipertrofia");
  const [variation, setVariation] = useState(0);
  const [saving, setSaving] = useState(false);
  const plan = useMemo(() => buildTrainingPlan(exercises, {
    goal, level, frequency, minutes, equipment, variation, priorityMuscles,
  }), [exercises, goal, level, frequency, minutes, equipment, variation, priorityMuscles]);
  const total = plan.workouts.reduce((sum, workout) => sum + workout.exercises.length, 0);

  const togglePriority = (muscle: string) => {
    setPriorityMuscles((current) => current.includes(muscle)
      ? current.filter((item) => item !== muscle)
      : [...current, muscle]);
  };

  const save = () => {
    if (saving || !total) return;
    setSaving(true);
    try {
      const routineId = createRoutine(name.trim() || "Plano personalizado");
      plan.workouts.forEach((workout) => {
        const workoutId = createWorkout(routineId, workout.name);
        updateWorkout(workoutId, {
          days: workout.days,
          exerciseIds: workout.exercises.map((exercise) => exercise.exerciseId),
          targetSets: Object.fromEntries(workout.exercises.map((exercise) => [exercise.exerciseId, exercise.sets])),
          targetReps: Object.fromEntries(workout.exercises.map((exercise) => [exercise.exerciseId, { min: exercise.min, max: exercise.max }])),
          restSeconds: plan.rest,
          restSecondsByExercise: Object.fromEntries(workout.exercises.map((exercise) => [exercise.exerciseId, exercise.rest])),
          notes: "Plano TorvGym · " + plan.goal + " · " + plan.reps + " reps. Registre seu desempenho e revise a progressão com base no histórico.",
        });
      });
      toast.success("Plano criado e salvo em Rotinas.");
      setOpen(false);
    } catch {
      toast.error("Não foi possível concluir. Confira a lista de rotinas antes de tentar novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-5">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 to-card p-4 text-left transition hover:border-primary/50">
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-widest text-primary">Nova ferramenta · Planejamento inteligente</span>
          <span className="mt-1 block text-lg font-black">Monte uma rotina personalizada</span>
          <span className="mt-1 block text-xs text-muted-foreground">Objetivo, frequência, equipamentos e músculos prioritários ligados à execução do treino.</span>
        </span>
        <span className="shrink-0 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">{open ? "Fechar" : "Começar"}</span>
      </button>

      {open && (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <Card className="space-y-5">
            <div>
              <b className="text-sm">1. Qual é seu objetivo?</b>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {goals.map((item) => (
                  <button key={item.value} type="button" onClick={() => {
                    setGoal(item.value);
                    setName("Plano personalizado · " + item.label);
                  }} aria-pressed={goal === item.value}
                    className={"rounded-xl border p-3 text-sm font-bold " + (goal === item.value ? "border-primary bg-primary/10" : "border-border bg-elevated")}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <b className="text-sm">2. Seu nível de experiência</b>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {levels.map((item) => (
                  <button key={item.value} type="button" onClick={() => setLevel(item.value)} aria-pressed={level === item.value}
                    className={"rounded-xl border p-2 text-xs font-bold " + (level === item.value ? "border-primary bg-primary/10" : "border-border bg-elevated")}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <b className="text-sm">3. Onde você vai treinar?</b>
              <div className="mt-2 space-y-2">
                {equipmentOptions.map((item) => (
                  <button key={item.value} type="button" onClick={() => setEquipment(item.value)} aria-pressed={equipment === item.value}
                    className={"w-full rounded-xl border p-3 text-left " + (equipment === item.value ? "border-primary bg-primary/10" : "border-border bg-elevated")}>
                    <b className="block text-sm">{item.label}</b>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <b className="text-sm">4. Quantos dias por semana?</b>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((days) => (
                  <button key={days} type="button" onClick={() => setFrequency(days)} aria-pressed={frequency === days}
                    className={"rounded-xl border py-2.5 font-bold " + (frequency === days ? "border-primary bg-primary text-primary-foreground" : "border-border bg-elevated")}>
                    {days}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <b className="text-sm">5. Tempo disponível por sessão</b>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[30, 45, 60, 75].map((time) => (
                  <button key={time} type="button" onClick={() => setMinutes(time)} aria-pressed={minutes === time}
                    className={"rounded-xl border py-2.5 font-bold " + (minutes === time ? "border-primary bg-primary text-primary-foreground" : "border-border bg-elevated")}>
                    {time} min
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-start justify-between gap-3">
                <div><b className="text-sm">6. Músculos prioritários</b><p className="mt-1 text-xs text-muted-foreground">Opcional · selecione até 3 para influenciar a escolha dos exercícios.</p></div>
                <span className="shrink-0 text-xs font-bold text-primary">{priorityMuscles.length}/3</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {muscleOptions.map((muscle) => {
                  const selected = priorityMuscles.includes(muscle);
                  const disabled = !selected && priorityMuscles.length >= 3;
                  return <button key={muscle} type="button" disabled={disabled} onClick={() => togglePriority(muscle)} aria-pressed={selected}
                    className={"rounded-full border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 " + (selected ? "border-primary bg-primary/15 text-primary" : "border-border bg-elevated")}>
                    {selected ? "✓ " : "+ "}{muscle}
                  </button>;
                })}
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Prévia revisável</p>
              <h3 className="mt-1 text-xl font-black">{plan.title}</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[["Objetivo", plan.goal], ["Repetições", plan.reps], ["Descanso", plan.rest + "s"]].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-elevated p-3">
                    <small className="text-muted-foreground">{label}</small>
                    <p className="text-sm font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <label className="mt-3 block text-xs font-bold">Nome da rotina
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80}
                  className="control mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-2.5 text-sm" />
              </label>
              <p className="mt-3 text-xs font-semibold">{total} exercícios previstos · {frequency} treinos semanais</p>
              {priorityMuscles.length > 0 && <p className="mt-2 text-xs text-primary">Prioridade: {priorityMuscles.join(", ")}</p>}
              {plan.warnings.map((warning) => <p key={warning} className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">{warning}</p>)}
            </Card>
            {plan.workouts.map((workout, index) => (
              <Card key={workout.name} className="overflow-hidden p-0">
                <div className="border-b border-border p-3">
                  <p className="text-[10px] font-bold uppercase text-primary">Treino {String.fromCharCode(65 + index)} · {workout.days.map((day) => weekdayLabels[day]).join(", ")}</p>
                  <b>{workout.name}</b>
                  <p className="text-xs text-muted-foreground">{workout.focus || "Grupos disponíveis"}</p>
                </div>
                {workout.exercises.map((item) => {
                  const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
                  if (!exercise) return null;
                  return <div key={item.exerciseId} className="flex items-center gap-3 border-b border-border/50 p-3">
                    <ExerciseMedia exercise={exercise} className="h-11 w-11 shrink-0" rounded="rounded-lg" />
                    <div className="min-w-0"><p className="text-sm font-bold">{exercise.name}</p><p className="text-xs text-muted-foreground">{item.sets} séries · {item.min}–{item.max} reps · {item.rest}s de descanso</p></div>
                  </div>;
                })}
              </Card>
            ))}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={() => setVariation((value) => value + 1)}>Gerar outra seleção</Button>
              <Button className="flex-1" disabled={!total || saving} onClick={save}>{saving ? "Salvando..." : "Salvar e criar rotina"}</Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Prescrições gerais para referência, não substituem avaliação profissional. A rotina permanece editável em Rotinas.</p>
          </div>
        </div>
      )}
    </section>
  );
}
