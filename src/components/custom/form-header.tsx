interface FormHeaderProps {
  title: string;
  description?: string;
}

export default function FormHeader({ title, description }: FormHeaderProps) {
  return (
    <header>
      <h1 className="text-2xl font-semibold font-display text-primary">
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </header>
  );
}

export function FormSectionHeader({ title, description }: FormHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </header>
  );
}
