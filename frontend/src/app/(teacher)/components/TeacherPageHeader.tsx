export const TeacherPageHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) => {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-accent">
          Tanári felület
        </div>
        <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
        <p className="text-faded mt-1 max-w-3xl">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
};
