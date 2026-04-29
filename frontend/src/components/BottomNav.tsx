import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Цены', icon: 'show_chart', exact: true },
  { to: '/banks', label: 'Банки', icon: 'account_balance', exact: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-8 pb-6 pt-3 bg-white border-t border-zinc-100 shadow-nav rounded-t-lg">
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center hover:opacity-80 active:scale-90 transition-transform ${
              isActive ? 'text-black font-bold' : 'text-zinc-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-semibold text-[11px] mt-1">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
