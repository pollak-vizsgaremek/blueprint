import { EventNavigationMap } from "@/components/navigation/EventNavigationMap";
import { EventWithRegistrationInfo } from "@/types";

type EventModalPlaceTabProps = {
  selectedEvent: EventWithRegistrationInfo | null;
};

export const EventModalPlaceTab = ({
  selectedEvent,
}: EventModalPlaceTabProps) => {
  return (
    <div className="mt-4 flex grow flex-col overflow-y-auto px-4 pb-6 sm:mt-5 sm:px-6 lg:px-10">
      <div className="text-lg font-semibold">Helyszín</div>
      <div className="text-faded mt-1 mb-4">{selectedEvent?.location}</div>

      {selectedEvent ? (
        <EventNavigationMap classroom={selectedEvent.classroom} />
      ) : null}
    </div>
  );
};
