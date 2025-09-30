import prisma from "../config/database.js";

export const getAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany();
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createEvent = async (req, res) => {
  const { name, description, creator, location, date } = req.body;

  try {
    const newEvent = await prisma.event.create({
      data: {
        name,
        description,
        creator,
        location,
        date,
      },
    });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
