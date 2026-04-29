import { EventNavigationMap } from "@/components/navigation/EventNavigationMap";
import { EventWithRegistrationInfo } from "@/types";

type EventModalPlaceTabProps = {
  selectedEvent: EventWithRegistrationInfo | null;
};

export const EventModalPlaceTab = ({
  selectedEvent,
}: EventModalPlaceTabProps) => {
  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-5 pb-6 flex grow overflow-y-auto flex-col">
      <div className="text-lg font-semibold">Helyszín</div>
      <div className="text-faded mt-1 mb-4">{selectedEvent?.location}</div>

      {selectedEvent ? (
        <EventNavigationMap classroom={selectedEvent.classroom} />
      ) : null}
    </div>
  );
};
