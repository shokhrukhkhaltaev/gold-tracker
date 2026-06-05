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

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white px-4 py-3 rounded-xl border border-zinc-200 shadow-sm hover:border-amber-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-amber-500 text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            location_on
          </span>
          <span className="font-semibold text-[14px] text-on-surface">{selected || 'Город'}</span>
        </div>
        <span className={`material-symbols-outlined text-secondary text-[20px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-card-hover border border-outline-variant z-40 overflow-hidden max-h-64 overflow-y-auto">
          {cities.map(city => (
            <button
              key={city}
              onClick={() => { onChange(city); setOpen(false); }}
              className={`w-full text-left px-4 py-3 text-[14px] font-semibold flex items-center gap-2 hover:bg-surface-container-low transition-colors ${
                city === selected ? 'text-amber-600 bg-amber-50' : 'text-on-surface'
              }`}
            >
              {city === selected && (
                <span
                  className="material-symbols-outlined text-amber-500 text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              )}
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
