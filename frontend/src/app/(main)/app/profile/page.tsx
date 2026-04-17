"use client";

import { useAuth } from "@/contexts/AuthContext";
import { isReducedMotionEnabled } from "@/lib/motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const ProfilePage = () => {
  const { user } = useAuth();

  useGSAP(() => {
    if (isReducedMotionEnabled()) {
      return;
    }

    gsap.from("#pbox", {
      scale: 0.9,
      opacity: 0,
      delay: 0.1,
      ease: "expo.in",
      duration: 0.5,
    });
  }, []);
  return (
    <main
      id="pbox"
      className="w-full flex justify-center items-start h-screen mt-12"
    >
      <div className="bg-secondary/30 p-10 border-faded/50 border-[1px] rounded-xl shadow-black/20 shadow-md hover:shadow-lg transition ease-in-out h-[700px] w-full max-w-[600px]">
        <div className="text-5xl mb-5">Profil</div>
        <div className="rounded-full bg-faded flex justify-center items-center text-white size-36 text-3xl shrink-0 select-none">
          {user?.name.slice(0, 1)}
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
