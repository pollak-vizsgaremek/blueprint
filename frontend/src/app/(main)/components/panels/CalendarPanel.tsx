export const CalendarPanel = () => {
  return (
    <div className="grow flex p-2 justify-between hover:bg-faded/20 transition ease-in-out cursor-pointer rounded-xl">
      <div className="w-2/3 m-auto h-full border-[2px] flex flex-col justify-between rounded-md border-faded/40 ">
        <div className="flex justify-center grow items-center flex-col gap-2">
          <div className="text-6xl font-bold">2.</div>
          <div className="tracking-wider text-sm text-faded">Május</div>
        </div>
        <div className="text-center py-1 text-white text-sm w-full bg-green-400 rounded-b-sm">
          11:00 Pollák Esport
        </div>
      </div>
    </div>
  );
};
