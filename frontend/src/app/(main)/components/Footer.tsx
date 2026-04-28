import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa6";

export const Footer = () => {
  return (
    <div className="w-full h-80 pt-5 bg-primary/20 backdrop-blur-md pb-3">
      <div className="h-8/10 justify-between flex items-start max-w-[500px] m-auto">
        <div className="">
          <div className="text-xl font-bold tracking-widest uppercase mb-5">
            Oldalak
          </div>
          <div className="flex flex-col gap-2 *:hover:text-faded transition ease-in-out">
            <Link href={"/"}>Főoldal</Link>
            <Link href={"/events"}>Események</Link>
            <Link href={"/appointments"}>Időpontok</Link>
            <Link href={"/settings"}>Beállítások</Link>
            <Link href={"/news"}>Hírek</Link>
          </div>
        </div>
        <div className="">
          <div className="text-xl font-bold tracking-widest uppercase mb-5">
            Elérhetőség
          </div>
          <div className="flex flex-col gap-2 *:hover:text-faded transition ease-in-out">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              TikTok
            </a>
            <a href="mailto:info@hszc.hu">Email</a>
            <a href="tel:+36123456789">Telefon</a>
          </div>
        </div>
      </div>
      <div className="h-1/10 w-full flex gap-5 justify-center">
        <a
          href="https://github.com/pollak-vizsgaremek/blueprint/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaGithub className="size-7" />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <FaTwitter className="size-7" />
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaLinkedin className="size-7" />
        </a>
      </div>
      <div className="h-1/10 text-center mt-2">
        Copyright © HSZC Szentesi Pollák Antal Technikum. All Rights Reserved.
      </div>
    </div>
  );
};
