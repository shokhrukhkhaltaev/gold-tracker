const WEIGHTS = [5, 10, 20, 50, 100];

interface WeightChipsProps {
  selected: number;
  onChange: (weight: number) => void;
}

export default function WeightChips({ selected, onChange }: WeightChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {WEIGHTS.map(w => (
        <button
          key={w}
          onClick={() => onChange(w)}
          className={`px-6 py-2 rounded-full font-label-bold text-label-bold whitespace-nowrap transition-colors ${
            selected === w
              ? 'bg-primary-container text-on-primary-fixed-variant border border-primary shadow-sm'
              : 'border border-outline-variant text-secondary hover:bg-surface-container-low'
          }`}
        >
          {w}г
        </button>
      ))}
    </div>
  );
}
