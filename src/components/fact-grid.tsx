import { IUCN_LABEL, type Iucn } from "@/data/species";
import { StatusBadge } from "@/components/ui/badge";

export function FactGrid({
  habitat,
  diet,
  behaviour,
  conservation,
}: {
  habitat: string;
  diet: string;
  behaviour: string;
  conservation: Iucn;
}) {
  const facts = [
    { label: "Habitat", value: habitat },
    { label: "Diet", value: diet },
    { label: "Behaviour", value: behaviour },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-2xl bg-cream px-4 py-3">
          <p className="kicker text-moss">{fact.label}</p>
          <p className="mt-1 text-sm leading-6 text-ink">{fact.value}</p>
        </div>
      ))}
      <div className="rounded-2xl bg-cream px-4 py-3">
        <p className="kicker text-moss">Status</p>
        <div className="mt-2">
          <StatusBadge status={conservation} label={IUCN_LABEL[conservation]} />
        </div>
      </div>
    </div>
  );
}
