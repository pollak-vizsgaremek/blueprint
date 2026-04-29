import { WorkspacePageHeader } from "@/components/WorkspacePageHeader";

export const AdminPageHeader = ({
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
      sectionLabel="Admin felület"
    />
  );
};
