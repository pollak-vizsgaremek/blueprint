import { EventEditForm } from "@/components/events/EventEditForm";
import { formatDateOnlyHu, formatDateTimeHu } from "@/lib/dateFormat";
import {
  createEventEditFormState,
  EventEditFormState,
  validateEventEditForm,
} from "@/lib/eventManage";
import { EventWithRegistrationInfo, UserOption } from "@/types";
import { Building2, CalendarDays, MapPin, UserRound } from "lucide-react";

type EventModalDetailsTabProps = {
  selectedEvent: EventWithRegistrationInfo | null;
  canManageSelectedEvent: boolean;
  isEditingEvent: boolean;
  setIsEditingEvent: (next: boolean | ((previous: boolean) => boolean)) => void;
  isDeleteManagedEventPending: boolean;
  onDeleteEvent: () => void;
  eventForm: EventEditFormState;
  usersLite: UserOption[];
  isUpdateManagedEventPending: boolean;
  setEventForm: (next: EventEditFormState) => void;
  onSaveManagedEvent: () => void;
  showWarning: (message: string) => void;
  canRegister: boolean;
  isRegisterPending: boolean;
  onToggleRegistration: () => void;
};

export const EventModalDetailsTab = ({
  selectedEvent,
  canManageSelectedEvent,
  isEditingEvent,
  setIsEditingEvent,
  isDeleteManagedEventPending,
  onDeleteEvent,
  eventForm,
  usersLite,
  isUpdateManagedEventPending,
  setEventForm,
  onSaveManagedEvent,
  showWarning,
  canRegister,
  isRegisterPending,
  onToggleRegistration,
}: EventModalDetailsTabProps) => {
  return (
    <div className="px-4 sm:px-6 lg:px-10 pb-6 sm:pb-10 mt-5 flex justify-between flex-col grow">
      <div>
        <div className="text-2xl sm:text-3xl lg:text-4xl mb-3">
          {selectedEvent?.name}
        </div>
        <div className="text-gray-600 text-justify mb-5">
          {selectedEvent?.description}
        </div>
        {canManageSelectedEvent && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditingEvent((previous) => !previous)}
              className="rounded-xl bg-sky-100 px-3 py-2 text-sm text-sky-700 hover:bg-sky-200 transition"
            >
              {isEditingEvent ? "Szerkesztés bezárása" : "Szerkesztés"}
            </button>
            <button
              onClick={onDeleteEvent}
              disabled={isDeleteManagedEventPending}
              className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-200 transition disabled:bg-faded disabled:text-faded disabled:cursor-not-allowed"
            >
              {isDeleteManagedEventPending ? "Törlés..." : "Törlés"}
            </button>
          </div>
        )}
        {canManageSelectedEvent && isEditingEvent && (
          <EventEditForm
            form={eventForm}
            usersLite={usersLite}
            isSaving={isUpdateManagedEventPending}
            onChange={setEventForm}
            onSave={() => {
              const validationMessage = validateEventEditForm(eventForm);

              if (validationMessage) {
                showWarning(validationMessage);
                return;
              }

              onSaveManagedEvent();
            }}
            onCancel={() => {
              setIsEditingEvent(false);
              setEventForm(createEventEditFormState(selectedEvent));
            }}
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <UserRound size={16} className="text-accent" />
            <span>Szervező: {selectedEvent?.creator || "Ismeretlen"}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <CalendarDays size={16} className="text-accent" />
            <span>{formatDateTimeHu(selectedEvent?.date)}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <MapPin size={16} className="text-accent" />
            <span>{selectedEvent?.location || "Nincs helyszín"}</span>
          </div>
          <div className="rounded-xl border border-faded/20 bg-secondary/35 px-3 py-2 inline-flex items-center gap-2">
            <Building2 size={16} className="text-accent" />
            <span>{selectedEvent?.classroom || "Nincs tanterem"}</span>
          </div>
        </div>
      </div>
      <div className="w-full justify-between flex mt-10 items-center">
        <div className=" px-3 py-2 inline-flex text-faded text-sm items-center gap-2">
          <CalendarDays size={16} className="" />
          <span>Létrehozva: {formatDateOnlyHu(selectedEvent?.createdAt)}</span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-sm text-gray-600">
            {selectedEvent && selectedEvent.maxParticipants
              ? `${selectedEvent.registrationCount}/${selectedEvent.maxParticipants} jelentkező`
              : selectedEvent
                ? `${selectedEvent.registrationCount} jelentkező`
                : ""}
          </div>
          <button
            onClick={onToggleRegistration}
            disabled={!canRegister || isRegisterPending}
            className="bg-accent text-white text-xl px-3 py-2 hover:bg-accent/60 transition ease-in-out active:scale-95 active:duration-75 rounded-xl cursor-pointer disabled:bg-faded disabled:cursor-not-allowed"
          >
            {isRegisterPending
              ? "Feldolgozás..."
              : selectedEvent?.isUserRegistered
                ? "Lemondás"
                : "Jelentkezés"}
          </button>
        </div>
      </div>
    </div>
  );
};
