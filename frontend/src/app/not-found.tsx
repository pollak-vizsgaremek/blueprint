import { FaArrowRight } from "react-icons/fa6";

const NotFoundPage = () => {
  return (
    <div className="h-screen w-screen flex justify-center items-center flex-col gap-4 text-3xl max-md:text-2xl">
      <div className="">
        <div className="text-4xl mb-2">Oops...</div>
        <div className="mb-5">Ezt az oldalt nem találtuk</div>
        <a
          href="/"
          className="flex gap-5 items-center text-accent underline decoration-accent"
        >
          Vissza a főoldalra <FaArrowRight size={40} />
        </a>
      </div>
    </div>
  );
};

export default NotFoundPage;
