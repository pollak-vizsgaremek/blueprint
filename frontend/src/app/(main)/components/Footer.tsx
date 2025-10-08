import { FaGithub, FaX, FaTemperatureThreeQuarters } from "react-icons/fa6";

export const Footer = () => {
  return (
    <div className="w-full h-70 absolute -bottom-70">
      <div className="h-8/10 justify-between flex items-center max-w-[600px] m-auto">
        <div className="">Oldalak</div>
        <div className="">Elérhetőségek</div>
        <div className="">Linkek</div>
      </div>
      <div className="h-1/10 w-full flex gap-5">
        <FaGithub />
        <FaX />
      </div>
      <div className="h-1/10 text-center">
        Copyright © Hódmezővásárhelyi SZC Szentesi Pollák Antal Technikum. All
        Rights Reserved.
      </div>
    </div>
  );
};
