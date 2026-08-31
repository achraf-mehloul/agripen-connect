import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate, fullName } from "@/lib/format";
import { createClientId } from "@/lib/ids";
import {
  addMeasurement,
  createExperiment,
  deleteExperiment,
  fetchExperiments,
  fetchMeasurements,
  updateExperiment,
} from "@/services/workspace-service";
import type { ExperimentStatus } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/experiments")({
  head: () => ({
    meta: [
      { title: "Experiments — AgriPen Team App" },
      {
        name: "description",
        content: "Track AgriPen field trials, sensors, metrics and measurement results.",
      },
      { property: "og:title", content: "Experiments — AgriPen Team App" },
      {
        property: "og:description",
        content: "Track AgriPen field trials, sensors, metrics and measurement results.",
      },
    ],
  }),
  component: ExperimentsPage,
});

const STATUSES: ExperimentStatus[] = ["planned", "running", "pass", "fail", "needs_review"];

const statusStyle: Record<ExperimentStatus, string> = {
  planned: "bg-muted text-muted-foreground",
  running: "bg-primary/15 text-primary",
  pass: "bg-success/15 text-success",
  fail: "bg-destructive/15 text-destructive",
  needs_review: "bg-warning/15 text-warning",
};

function ExperimentsPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ExperimentStatus | "all">("all");
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    environment: "",
    soilType: "",
    sensors: "",
    metrics: "",
  });

  const experiments = useQuery({
    queryKey: ["experiments", filter],
    queryFn: () => (filter === "all" ? fetchExperiments() : fetchExperiments(filter)),
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["experiments"] });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      return createExperiment({
        clientId: createClientId("exp"),
        ownerId: user.id,
        code: form.code.trim() || `EXP-${Date.now().toString().slice(-5)}`,
        title: form.title.trim(),
        description: form.description.trim(),
        status: "planned",
        environment: form.environment.trim() || null,
        soilType: form.soilType.trim() || null,
        sensors: form.sensors
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        metrics: form.metrics
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        startedOn: new Date().toISOString().slice(0, 10),
      });
    },
    onSuccess: () => {
      toast.success("Experiment created");
      setOpen(false);
      setForm({
        code: "",
        title: "",
        description: "",
        environment: "",
        soilType: "",
        sensors: "",
        metrics: "",
      });
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="space-y-4">
      <header className="glass rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Experiments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Field trials with sensors, metrics and measurements.
            </p>
          </div>
          <Button onClick={() => setOpen((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />
            New experiment
          </Button>
        </div>

        {open ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Code (EXP-001)"
                value={form.code}
                onChange={(event) => setForm((f) => ({ ...f, code: event.target.value }))}
              />
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
              />
              <Input
                placeholder="Environment (greenhouse, open field…)"
                value={form.environment}
                onChange={(event) => setForm((f) => ({ ...f, environment: event.target.value }))}
              />
              <Input
                placeholder="Soil type"
                value={form.soilType}
                onChange={(event) => setForm((f) => ({ ...f, soilType: event.target.value }))}
              />
              <Input
                placeholder="Sensors (comma separated)"
                value={form.sensors}
                onChange={(event) => setForm((f) => ({ ...f, sensors: event.target.value }))}
              />
              <Input
                placeholder="Metrics (comma separated)"
                value={form.metrics}
                onChange={(event) => setForm((f) => ({ ...f, metrics: event.target.value }))}
              />
            </div>
            <Textarea
              placeholder="What is this experiment testing?"
              value={form.description}
              onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
            />
            <Button
              onClick={() => create.mutate()}
              disabled={!form.title.trim() || create.isPending}
            >
              Save experiment
            </Button>
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {value.replace("_", " ")}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {experiments.isLoading ? (
          <>
            <Skeleton className="h-24 rounded-3xl" />
            <Skeleton className="h-24 rounded-3xl" />
          </>
        ) : (experiments.data ?? []).length === 0 ? (
          <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
            No experiments yet. Create the first trial.
          </p>
        ) : (
          (experiments.data ?? []).map((experiment) => (
            <article key={experiment.id} className="glass rounded-3xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">{experiment.code}</p>
                  <h2 className="truncate font-display text-lg font-bold">{experiment.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fullName(experiment.owner?.first_name, experiment.owner?.last_name)}
                    {experiment.started_on ? ` · started ${formatDate(experiment.started_on)}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${statusStyle[experiment.status]}`}
                >
                  {experiment.status.replace("_", " ")}
                </span>
              </div>

              {experiment.description ? (
                <p className="mt-3 whitespace-pre-wrap text-sm">{experiment.description}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...experiment.sensors, ...experiment.metrics].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {experiment.owner_id === user?.id || isAdmin ? (
                  <>
                    {STATUSES.filter((status) => status !== experiment.status).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await updateExperiment(experiment.id, { status });
                          refresh();
                        }}
                      >
                        {status.replace("_", " ")}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        await deleteExperiment(experiment.id);
                        refresh();
                      }}
                    >
                      Delete
                    </Button>
                  </>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenId(openId === experiment.id ? null : experiment.id)}
                >
                  {openId === experiment.id ? "Hide measurements" : "Measurements"}
                </Button>
              </div>

              {openId === experiment.id ? <Measurements experimentId={experiment.id} /> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function Measurements({ experimentId }: { experimentId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ metric: "", value: "", unit: "" });
  const measurements = useQuery({
    queryKey: ["measurements", experimentId],
    queryFn: () => fetchMeasurements(experimentId),
  });

  const add = async () => {
    if (!user || !form.metric.trim() || !form.value.trim()) return;
    try {
      await addMeasurement({
        experimentId,
        createdBy: user.id,
        metric: form.metric.trim(),
        unit: form.unit.trim() || "unit",
        value: Number(form.value),
        measuredAt: new Date().toISOString(),
      });
      setForm({ metric: "", value: "", unit: "" });
      void queryClient.invalidateQueries({ queryKey: ["measurements", experimentId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save measurement");
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <div className="grid gap-2 sm:grid-cols-4">
        <Input
          placeholder="Metric"
          value={form.metric}
          onChange={(event) => setForm((f) => ({ ...f, metric: event.target.value }))}
        />
        <Input
          placeholder="Value"
          type="number"
          value={form.value}
          onChange={(event) => setForm((f) => ({ ...f, value: event.target.value }))}
        />
        <Input
          placeholder="Unit"
          value={form.unit}
          onChange={(event) => setForm((f) => ({ ...f, unit: event.target.value }))}
        />
        <Button onClick={() => void add()}>Add</Button>
      </div>
      <ul className="space-y-1.5">
        {(measurements.data ?? []).map((measurement) => (
          <li
            key={measurement.id}
            className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
          >
            <span className="font-medium">{measurement.metric}</span>
            <span className="text-muted-foreground">
              {measurement.value} {measurement.unit} · {formatDate(measurement.measured_at)}
            </span>
          </li>
        ))}
        {measurements.data?.length === 0 ? (
          <li className="text-xs text-muted-foreground">No measurements recorded yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
