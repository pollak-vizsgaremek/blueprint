"use client";

import { FormModal } from "@/components/FormModal";

type TeacherFormModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
};

export const TeacherFormModal = ({
  isOpen,
  title,
  description,
  onClose,
  children,
  maxWidthClassName = "max-w-3xl",
}: TeacherFormModalProps) => {
  return (
    <FormModal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
      maxWidthClassName={maxWidthClassName}
    >
      {children}
    </FormModal>
  );
};
