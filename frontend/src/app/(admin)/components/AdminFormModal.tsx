"use client";

import { FormModal } from "@/components/FormModal";

type AdminFormModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
};

export const AdminFormModal = ({
  isOpen,
  title,
  description,
  onClose,
  children,
  maxWidthClassName = "max-w-3xl",
}: AdminFormModalProps) => {
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
