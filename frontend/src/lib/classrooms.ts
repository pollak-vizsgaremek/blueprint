export const CLASSROOM_OPTIONS = [
  "Info I",
  "Info II",
  "Info III",
  "Info IV",
  "Info V",
  "Info VI",
  "Info VII",
  "I. Tant.",
  "V. Tant.",
  "VI. Tant.",
  "VII. Tant.",
  "VIII. Tant.",
  "IX. Tant.",
  "X. Tant.",
  "Mat1",
  "Mat2",
  "Mat3",
  "CadC",
  "Kajtor",
  "Nylabor",
  "PLC",
  "DKA",
  "KNX",
  "Elektr",
  "IpElek",
  "Mech",
  "Torna T.",
  "Játék",
] as const;

export const NAVIGATION_START = "FőBej";

export const CLASSROOM_LABELS: Record<string, string> = {
  "I. Tant.": "I. tanterem",
  "V. Tant.": "V. tanterem",
  "VI. Tant.": "VI. tanterem",
  "VII. Tant.": "VII. tanterem",
  "VIII. Tant.": "VIII. tanterem",
  "IX. Tant.": "IX. tanterem",
  "X. Tant.": "X. tanterem",
  Mat1: "Matematika 1",
  Mat2: "Matematika 2",
  Mat3: "Matematika 3",
  CadC: "CAD/CAM labor",
  Kajtor: "Kajtor labor",
  Nylabor: "Nyelvi labor",
  Elektr: "Elektronika labor",
  IpElek: "Ipari elektronika labor",
  Mech: "Mechatronika labor",
};

export const getClassroomLabel = (value: string) =>
  CLASSROOM_LABELS[value] ?? value;
