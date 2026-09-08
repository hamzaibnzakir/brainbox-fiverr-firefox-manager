import { clsx, type ClassValue } from "clsx";

/** Merge conditional class names. Kept dependency-light (no tailwind-merge)
 * on purpose — this project doesn't stack conflicting utility variants. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
