import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors];
};

// Removed Vapi-specific configuration function
// Added generic configuration interface for future API usage
export interface ApiConfig {
  subject: string;
  topic: string;
  style: string;
  voice: string;
}
