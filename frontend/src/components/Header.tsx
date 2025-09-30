import Image from "next/image";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="w-full h-20 px-10 py-2 flex justify-between">
      <div className="flex items-center gap-3">
        <Image src="/blueprint.png" alt="Logo" width={50} height={50} />
        <div className="text-2xl">Blueprint</div>
      </div>
      <div className="flex gap-2 items-center text-xl">
        <Link href="/">Főoldal</Link>
        <Link href="/events">Események</Link>
        <Link href="/reservation">Időpont</Link>
        <Image
          src="https://placehold.co/50x50"
          alt="Profile"
          width={40}
          height={40}
          className="rounded-full ml-5"
        />
      </div>
    </header>
  );
};
