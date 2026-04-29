import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa6";
import { Roboto_Mono } from "next/font/google";

const roboto = Roboto_Mono({
  subsets: ["latin"],
});

const pageLinks = [
  { href: "/", label: "Főoldal" },
  { href: "/events", label: "Események" },
  { href: "/appointments", label: "Időpontok" },
  { href: "/settings", label: "Beállítások" },
  { href: "/news", label: "Hírek" },
];

const contactLinks = [
  { href: "https://facebook.com", label: "Facebook", external: true },
  { href: "https://instagram.com", label: "Instagram", external: true },
  { href: "https://tiktok.com", label: "TikTok", external: true },
  { href: "mailto:info@hszc.hu", label: "Email" },
  { href: "tel:+36123456789", label: "Telefon" },
];

const socialLinks = [
  {
    href: "https://github.com/pollak-vizsgaremek/blueprint/",
    label: "GitHub",
    icon: FaGithub,
  },
  { href: "https://twitter.com", label: "X / Twitter", icon: FaTwitter },
  { href: "https://linkedin.com", label: "LinkedIn", icon: FaLinkedin },
];

export const Footer = () => {
  return (
    <footer className="w-full bg-primary/20 backdrop-blur-md py-8 sm:py-10 mt-10">
      <div className="page-shell">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 mx-auto max-w-4xl">
          <div>
            <Image
              src="/blueprint.png"
              alt="Blueprint logó"
              width={150}
              height={50}
              className="mb-4"
            />
            <div className={`${roboto.className} text-3xl`}>Blueprint</div>
          </div>
          <div className="flex flex-col gap-8 sm:gap-0 sm:flex-row justify-between">
            <div>
              <div className="text-xl font-bold tracking-widest uppercase mb-5">
                Oldalak
              </div>
              <div className="flex flex-col gap-2 *:hover:text-faded transition ease-in-out">
                {pageLinks.map((pageLink) => (
                  <Link key={pageLink.href} href={pageLink.href}>
                    {pageLink.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xl font-bold tracking-widest uppercase mb-5">
                Elérhetőség
              </div>
              <div className="flex flex-col gap-2 *:hover:text-faded transition ease-in-out">
                {contactLinks.map((contactLink) => (
                  <a
                    key={contactLink.href}
                    href={contactLink.href}
                    target={contactLink.external ? "_blank" : undefined}
                    rel={
                      contactLink.external ? "noopener noreferrer" : undefined
                    }
                  >
                    {contactLink.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-15 flex gap-5 justify-center">
        {socialLinks.map((socialLink) => {
          const SocialIcon = socialLink.icon;

          return (
            <a
              key={socialLink.href}
              href={socialLink.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={socialLink.label}
            >
              <SocialIcon className="size-7" />
            </a>
          );
        })}
      </div>
      <div className="text-center mt-4 px-4 text-sm text-faded">
        Copyright © HSZC Szentesi Pollák Antal Technikum. All Rights Reserved.
      </div>
    </footer>
  );
};
