"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  date: string;
  maxParticipants: number | null;
  imageUrl: string | null;
  creator: string;
  registrationCount: number;
}

const EventPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    date: "",
    maxParticipants: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
  };

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events`,
        {
          credentials: "include", // Include cookies in request
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const eventsData = await response.json();
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
      setMessage({
        type: "error",
        text: "Nem sikerült betölteni az eseményeket. Kérjük, próbáld újra.",
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Select an event for editing
  const selectEventForEditing = (event: Event) => {
    setSelectedEvent(event);
    setIsEditing(true);

    // Populate form with selected event data
    setFormData({
      name: event.name,
      description: event.description,
      location: event.location,
      date: new Date(event.date).toISOString().split("T")[0],
      maxParticipants: event.maxParticipants?.toString() || "",
    });

    // Clear any existing image selection since we're loading an existing event
    setImage(null);
  };

  // Clear selection and reset form for creating new event
  const createNewEvent = () => {
    setSelectedEvent(null);
    setIsEditing(false);
    setFormData({
      name: "",
      description: "",
      location: "",
      date: "",
      maxParticipants: "",
    });
    setImage(null);
    setMessage(null);
  };
  const deleteEvent = async () => {
    if (!selectedEvent) {
      setMessage({
        type: "error",
        text: "Be kell jelentkezned az események kezeléséhez",
      });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}`,
        {
          method: "DELETE",
          credentials: "include", // Include cookies in request
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      setMessage({
        type: "success",
        text: "Esemény sikeresen törölve!",
      });

      // Refresh events list
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      setMessage({
        type: "error",
        text: "Nem sikerült törölni az eseményt. Kérjük, próbáld újra.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("date", formData.date);
      if (formData.maxParticipants) {
        formDataToSend.append("maxParticipants", formData.maxParticipants);
      }
      if (image) {
        formDataToSend.append("image", image);
      }

      const url =
        isEditing && selectedEvent
          ? `${process.env.NEXT_PUBLIC_API_URL}/events/${selectedEvent.id}`
          : `${process.env.NEXT_PUBLIC_API_URL}/events`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        credentials: "include", // Include cookies in request
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(
          isEditing ? "Failed to update event" : "Failed to create event"
        );
      }

      const result = await response.json();
      setMessage({
        type: "success",
        text: isEditing
          ? "Esemény sikeresen frissítve!"
          : "Esemény sikeresen létrehozva!",
      });

      // Reset form and refresh events list
      setFormData({
        name: "",
        description: "",
        location: "",
        date: "",
        maxParticipants: "",
      });
      setImage(null);
      setSelectedEvent(null);
      setIsEditing(false);

      // Refresh events list
      fetchEvents();
    } catch (error) {
      console.error(
        isEditing ? "Error updating event:" : "Error creating event:",
        error
      );
      setMessage({
        type: "error",
        text: isEditing
          ? "Nem sikerült frissíteni az eseményt. Kérjük, próbáld újra."
          : "Nem sikerült létrehozni az eseményt. Kérjük, próbáld újra.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Events List */}
          <div className="lg:w-1/2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Meglévő események</h2>
              <button
                onClick={createNewEvent}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Új esemény létrehozása
              </button>
            </div>

            {isLoadingEvents ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Események betöltése...</div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Nincsenek események.</div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedEvent?.id === event.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => selectEventForEditing(event)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{event.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {event.description.length > 100
                            ? event.description.substring(0, 100) + "..."
                            : event.description}
                        </p>
                        <div className="mt-2 text-sm text-gray-500">
                          <div>📍 {event.location}</div>
                          <div>
                            📅 {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div>
                            👥 {event.registrationCount} jelentkező
                            {event.maxParticipants &&
                              ` / ${event.maxParticipants} max`}
                          </div>
                        </div>
                      </div>
                      {event.imageUrl && (
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-16 h-16 object-cover rounded ml-4"
                          width={64}
                          height={64}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event Form */}
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-bold mb-6">
              {isEditing
                ? `Szerkesztés: ${selectedEvent?.name}`
                : "Új esemény létrehozása"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div
                  className={`p-3 rounded ${
                    message.type === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <input
                type="text"
                name="name"
                placeholder="Esemény címe"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />

              <textarea
                name="description"
                placeholder="Esemény leírása"
                required
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded"
              />

              <input
                type="text"
                name="location"
                placeholder="Esemény helyszíne"
                required
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />

              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />

              <input
                type="number"
                name="maxParticipants"
                placeholder="Maximális létszám (opcionális)"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              />

              <div className="space-y-2">
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
                {isEditing && selectedEvent?.imageUrl && (
                  <div className="text-sm text-gray-600">
                    Jelenlegi kép:
                    <Image
                      src={selectedEvent.imageUrl}
                      alt="Jelenlegi esemény"
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded mt-1"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSubmitting
                    ? isEditing
                      ? "Frissítés..."
                      : "Létrehozás..."
                    : isEditing
                    ? "Esemény frissítése"
                    : "Esemény létrehozása"}
                </button>

                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={deleteEvent}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Törlés
                    </button>
                    <button
                      type="button"
                      onClick={createNewEvent}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Mégse
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPage;
