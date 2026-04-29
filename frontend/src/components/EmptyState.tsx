interface EmptyStateProps {
  message?: string;
  icon?: string;
}

export default function EmptyState({ message = 'Ничего не найдено', icon = 'search_off' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-secondary text-[32px]">{icon}</span>
      </div>
      <p className="text-body-md text-secondary">{message}</p>
    </div>
  );
}
