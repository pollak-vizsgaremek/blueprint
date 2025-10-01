import axios from "axios";
import { PiSquaresFourFill } from "react-icons/pi";
import { FaList } from "react-icons/fa6";
import { Event } from "@/components/Event";

const EventsPage = async () => {
  const { data: events } = await axios.get(`${process.env.API_URL}/events`);
  return (
    <div className="px-20 pt-5">
      <div className="flex justify-between border-b-[1px] border-slate-400 pb-1">
        <div className="flex gap-3 text-xl">
          <div className="bg-accent text-white rounded-md px-2">Összes</div>
          <div className="">Jövőbeli</div>
          <div className="">Folyamatban</div>
          <div className="">Befejezett</div>
        </div>
        <div className="flex gap-3 items-center">
          <PiSquaresFourFill
            size={30}
            className="bg-accent rounded-md"
            color="white"
          />

          <FaList size={25} />
        </div>
      </div>
      <div className="pt-5 px-5 flex gap-5 flex-wrap">
        {events.map((event: any) => {
          return (
            <Event
              Name={event.name}
              Date={event.date.slice(0, 10)}
              Creator={event.creator}
              Desc={event.description.slice(0, 10) + "..."}
              Location={event.location}
              key={event.id}
            />
          );
        })}
      </div>
    </div>
  );
};

export default EventsPage;
