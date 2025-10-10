import Image from "next/image";

export const NewsPanel = () => {
  return (
    <div className="grow flex p-2 justify-between hover:bg-faded/20 transition ease-in-out cursor-pointer rounded-xl">
      <div className="">
        <div className="text-xl">Új frissítés</div>
        <div className="text-faded">
          Fríssités 0.1.2. új feature és school project in one hour time.
        </div>
      </div>
      <div className="">
        <Image
          src={"https://picsum.photos/id/237/100/100"}
          alt={"news"}
          width={150}
          height={150}
          className="rounded-xl mt-2 shrink-0"
        />
      </div>
    </div>
  );
};
