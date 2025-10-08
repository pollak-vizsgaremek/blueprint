import { Name } from "@/components/Name";

const DashboardPage = () => {
  return (
    <main className="w-7/8 m-auto">
      <div className="text-3xl mb-8">
        Szép napot,{" "}
        <span className="font-bold text-accent">
          <Name />
        </span>
        !
      </div>
      <div className="flex w-full gap-4 mb-4">
        <div className="bg-secondary/80 border-faded border-[1px] grow h-60 rounded-xl basis-2/5"></div>
        <div className="bg-secondary/80 border-faded border-[1px] grow h-60 rounded-xl basis-3/5"></div>
      </div>
      <div className="flex w-full gap-4">
        <div className="bg-secondary/80 border-faded border-[1px] grow h-60 rounded-xl basis-1/5"></div>
        <div className="bg-secondary/80 border-faded border-[1px] grow h-60 rounded-xl basis-3/5"></div>
        <div className="bg-secondary/80 border-faded border-[1px] grow h-60 rounded-xl basis-1/5"></div>
      </div>
    </main>
  );
};

export default DashboardPage;
