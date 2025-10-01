import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";

export const Spinner = () => {
  return (
    <div className="flex justify-center items-center h-full w-full absolute top-0">
      <Tailspin size="40" stroke="5" speed="0.9" color="#1398c6" />
    </div>
  );
};
