import Image from "next/image";
import Link from "next/link";

const NotFoundPage = () => {
  const random = Math.random() < 0.5 ? "/404_rat.png" : "/404_koala.png";

  return (
    <div className="h-screen w-screen flex justify-center items-center flex-col gap-4 text-3xl">
      <div className="text-center">
        <Image
          src={random}
          alt="Not Found"
          loading="eager"
          priority
          width={500}
          height={500}
        />
        <div className="mb-2 mt-5">Oops...</div>
        <div className="mb-5">Ezt az oldalt nem találtuk</div>
        <Link
          href="/"
          className="text-center text-accent underline decoration-accent"
        >
          Vissza a főoldalra
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
