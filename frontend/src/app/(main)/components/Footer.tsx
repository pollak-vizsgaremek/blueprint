import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa6";

export const Footer = () => {
  return (
    <div className="w-full h-80 pt-5 bg-primary/20 backdrop-blur-md pb-3">
      <div className="h-8/10 justify-between flex items-start max-w-[600px] m-auto">
        <div className="">
          <div className="text-xl font-bold tracking-widest uppercase mb-5">
            Oldalak
          </div>
          <div className="flex flex-col gap-2 *:hover:text-faded transition ease-in-out">
            <Link href={"/"}>Blueprint</Link>
            <Link href={"/app"}>Főoldal</Link>
            <Link href={"/app/events"}>Események</Link>
            <Link href={"/app/appointments"}>Időpontok</Link>
            <Link href={"/app/settings"}>Beállítások</Link>
          </div>
        </div>
        <div className="">
          <div className="text-xl font-bold tracking-widest uppercase mb-5">
            Elérhetőség
          </div>
          <div className="flex flex-col gap-2 *:hover:text-faded transition ease-in-out">
            <a href="#">Facebook</a>
            <a href="#">Instagram</a>
            <a href="#">TikTok</a>
            <a href="#">Email</a>
            <a href="#">Telefon</a>
          </div>
        </div>
        <div className="">
          <div className="text-xl font-bold tracking-widest uppercase mb-5">
            Linkek
          </div>
          <div className="flex flex-col gap-2 *:hover:text-faded transition ease-in-out">
            <Link href={"/tos"}>ÁSZF</Link>
            <Link href={"/privacy"}>Adatvédelmi táj.</Link>
            <Link href={"/about"}>Rólunk</Link>
          </div>
        </div>
      </div>
      <div className="h-1/10 w-full flex gap-5 justify-center *:size-7">
        <FaGithub />
        <FaTwitter />
        <FaLinkedin />
      </div>
      <div className="h-1/10 text-center mt-2">
        Copyright © HSZC Szentesi Pollák Antal Technikum. All Rights Reserved.
      </div>
    </div>
  );
};
