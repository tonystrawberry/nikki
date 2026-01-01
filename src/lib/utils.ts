/**
 * UTILITIES - src/lib/utils.ts
 * ============================
 * 
 * General utility functions used throughout the app.
 * This file is safe to import in both Server and Client Components.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn - Class Name Utility
 * =======================
 * 
 * Combines and merges Tailwind CSS classes intelligently.
 * This is the standard utility used across shadcn/ui projects.
 * 
 * WHAT IT DOES:
 * 1. clsx() - Combines class names, handles conditionals
 * 2. twMerge() - Resolves Tailwind conflicts
 * 
 * WHY TWO LIBRARIES?
 * ------------------
 * clsx handles conditional class names:
 *   clsx('base', isActive && 'active', className)
 *   → 'base active custom-class'
 * 
 * twMerge resolves Tailwind conflicts:
 *   twMerge('px-4 px-6') → 'px-6' (later wins)
 *   twMerge('text-red-500 text-blue-500') → 'text-blue-500'
 * 
 * Without twMerge, both classes would apply and conflict.
 * 
 * USAGE:
 * ```tsx
 * <div className={cn(
 *   "base-classes px-4",           // Base styles
 *   isActive && "bg-primary",       // Conditional
 *   className                        // Props can override
 * )} />
 * ```
 * 
 * EXAMPLE WITH OVERRIDE:
 * ```tsx
 * // Component
 * function Button({ className }) {
 *   return <button className={cn("px-4 py-2 bg-blue-500", className)} />
 * }
 * 
 * // Usage - override background
 * <Button className="bg-red-500" />
 * // Result: "px-4 py-2 bg-red-500" (blue removed, red kept)
 * ```
 * 
 * @param inputs - Class names, conditions, arrays of classes
 * @returns Merged class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
