/**
 * The `cn` helper shadcn-registry components import from "@/lib/utils".
 *
 * A plain join rather than clsx + tailwind-merge: the only registry component
 * here is Kibo UI's contribution graph, and its default fill classes name
 * shadcn tokens (muted, muted-foreground) this design system doesn't define,
 * so they generate no CSS and there is nothing for a merge to resolve. Two
 * dependencies for that would be dead weight in the bundle.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
