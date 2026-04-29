import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa6";

export const Footer = () => {
  return (
    <footer className="w-full bg-primary/20 backdrop-blur-md py-8 sm:py-10 mt-10">
      <div className="page-shell">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 mx-auto max-w-xl">
          <div>
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
          <div>
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
      </div>
      <div className="mt-8 flex gap-5 justify-center">
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
      <div className="text-center mt-4 px-4 text-sm text-faded">
        Copyright © HSZC Szentesi Pollák Antal Technikum. All Rights Reserved.
      </div>
    </footer>
  );
};
