import { WorkspacePageHeader } from "@/components/WorkspacePageHeader";

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
    <WorkspacePageHeader
      title={title}
      description={description}
      actions={actions}
      sectionLabel="Tanári felület"
    />
  );
};
