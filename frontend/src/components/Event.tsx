import Image from "next/image";

export const Event = ({
  Name,
  Creator,
  Date,
  Desc,
  Location,
}: {
  Name: string;
  Creator: string;
  Date: string;
  Desc: string;
  Location: string;
}) => {
  return (
    <div className="w-80 h-70 flex flex-col">
      <div className="h-2/3 w-full relative">
        <Image
          src="https://placehold.co/900x600"
          alt="Event"
          fill
          className="rounded-t-2xl block object-cover"
        />
      </div>
      <div className="h-1/3 bg-primary rounded-b-2xl flex flex-col justify-between p-2">
        <div className="flex justify-between">
          <div className="flex flex-col">
            <div className="">{Name}</div>
            <div className="text-slate-500">{Desc}</div>
          </div>

          <div className="">{Location}</div>
        </div>
        <div className="flex justify-between">
          <div className="">{Creator}</div>
          <div className="">{Date}</div>
        </div>
      </div>
    </div>
  );
};
