import { iconMarkup } from './lucide-icons.ts'
/** Small pinned Lucide subset. @param props - Icon identity and optical size. @returns Decorative SVG. */
export function LucideIcon({ name, size = 18 }: { name: keyof typeof iconMarkup; size?: number }) {
  return <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: iconMarkup[name] }} />
}
