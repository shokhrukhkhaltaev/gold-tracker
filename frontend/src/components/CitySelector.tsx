import { useState, useRef, useEffect } from 'react';

interface CitySelectorProps {
  cities: string[];
  selected: string;
  onChange: (city: string) => void;
}

export default function CitySelector({ cities, selected, onChange }: CitySelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const allCities = ['Все города', ...cities];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-surface-container shadow-sm hover:bg-zinc-50 transition-colors"
      >
        <span className="material-symbols-outlined text-secondary text-[20px]">location_on</span>
        <span className="font-label-bold">{selected || 'Все города'}</span>
        <span className={`material-symbols-outlined text-secondary text-[18px] transition-transform ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-card-hover border border-outline-variant z-40 overflow-hidden">
          {allCities.map(city => (
            <button
              key={city}
              onClick={() => { onChange(city === 'Все города' ? '' : city); setOpen(false); }}
              className={`w-full text-left px-4 py-3 font-label-bold text-label-bold hover:bg-surface-container-low transition-colors ${
                (city === 'Все города' ? '' : city) === selected ? 'text-primary bg-primary-container/10' : 'text-on-surface'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
