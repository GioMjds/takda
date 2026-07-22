// Re-exports for the marketing homepage. Server components stay
// default-exported for clean tree-shaking; client components expose
// both a named and default export for tooling compatibility (matches
// the convention used by the login route's barrel).
export { NavBar } from './sections/NavBar';
export { HeroSection } from './sections/HeroSection';
export { DemoFrame } from './sections/DemoFrame';
export { FeaturesSection } from './sections/FeaturesSection';
export { FooterBar } from './sections/FooterBar';

// Next.js Pages Router compatibility dummy export. The page is fully
// driven by `app/[lang]/(marketing)/page.tsx`; this default export
// exists only so the module is a valid React component when imported
// by a Pages Router codepath.
export default function IndexDummy() {
  return null;
}
