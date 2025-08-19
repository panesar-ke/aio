interface FormHeaderProps {
  title: string
  description?: string
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
  )
}
