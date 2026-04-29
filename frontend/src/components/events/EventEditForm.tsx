import { EventEditFormState } from "@/lib/eventManage";
import { UserOption } from "@/types";

type EventEditFormProps = {
  form: EventEditFormState;
  usersLite: UserOption[];
  isSaving: boolean;
  onChange: (next: EventEditFormState) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const EventEditForm = ({
  form,
  usersLite,
  isSaving,
  onChange,
  onSave,
  onCancel,
}: EventEditFormProps) => {
  return (
    <div className="mb-5 rounded-xl border border-faded/40 bg-white/30 p-3">
      <div className="text-lg mb-2">Esemény szerkesztése</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          placeholder="Esemény neve"
          className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
        />
        <input
          value={form.location}
          onChange={(event) =>
            onChange({ ...form, location: event.target.value })
          }
          placeholder="Helyszín"
          className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
        />
        <input
          value={form.classroom}
          onChange={(event) =>
            onChange({ ...form, classroom: event.target.value })
          }
          placeholder="Tanterem"
          className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
        />
        <input
          type="datetime-local"
          value={form.date}
          onChange={(event) => onChange({ ...form, date: event.target.value })}
          className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
        />
        <input
          value={form.maxParticipants}
          onChange={(event) =>
            onChange({ ...form, maxParticipants: event.target.value })
          }
          placeholder="Max létszám (opcionális)"
          className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
        />
        <select
          value={form.updatedBy}
          onChange={(event) =>
            onChange({ ...form, updatedBy: event.target.value })
          }
          className="w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
        >
          <option value="">Válassz frissítőt</option>
          {usersLite.map((candidate) => (
            <option key={candidate.id} value={String(candidate.id)}>
              {candidate.name} ({candidate.role})
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={form.description}
        onChange={(event) =>
          onChange({ ...form, description: event.target.value })
        }
        rows={3}
        placeholder="Leírás"
        className="mt-2 w-full border border-faded/60 rounded-xl px-3 py-2 bg-white/20"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="rounded-xl bg-accent px-3 py-2 text-white disabled:bg-faded disabled:cursor-not-allowed"
        >
          {isSaving ? "Mentés..." : "Mentés"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-faded/40 px-3 py-2 text-faded"
        >
          Mégse
        </button>
      </div>
    </div>
  );
};
