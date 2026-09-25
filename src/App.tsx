import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import GlassFilter from "./components/GlassFilter";
import Footer from "./components/Footer";
import ScrollProgress from "./components/ScrollProgress";
import OneeCompanion from "./components/OneeCompanion";
import Home from "./pages/Home";
import { useWebMcpTools } from "./lib/useWebMcpTools";

// Case study + legal live behind routes the landing page never needs up front,
// so they are code-split — the initial bundle stays lean.
const CaseStudy = lazy(() => import("./pages/CaseStudy"));
const Legal = lazy(() => import("./pages/Legal"));
const Profile = lazy(() => import("./pages/Profile"));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return; // let in-page anchors handle themselves
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

// Pages glide in as a unit. A CSS keyframe (transform + opacity only, so it
// stays composited) replaces the motion library's AnimatePresence — remounting
// on the route key restarts the animation. Exit animations are dropped
// deliberately: holding the outgoing page in the tree to animate it out is what
// forced the whole animation runtime into the initial bundle.
//
// Not on the first document load, though. The page is prerendered, so its
// content is already in the HTML; fading it in from opacity 0 hid the hero
// heading from paint until the keyframe ran, and Chrome doesn't count
// opacity-0 paints toward Largest Contentful Paint — it logged the nav logo
// as LCP while the headline, the thing a visitor came for, was still
// invisible. The glide only means something as a transition between routes,
// so it starts from the second route onward. Server render and the hydrating
// client both see `false` on that first pass, so the markup matches.
let hasNavigated = false;

function Page({ children }: { children: React.ReactNode }) {
  // Read once at mount. Reading the flag on every render would add the class
  // to the first page the next time it re-rendered — an in-page #anchor
  // click changes the location — and replay the fade on a page already
  // on screen.
  const [animate] = useState(() => hasNavigated);
  return <div className={animate ? "page-enter" : undefined}>{children}</div>;
}

function AnimatedRoutes() {
  const location = useLocation();
  useEffect(() => {
    hasNavigated = true;
  }, []);
  const key = location.pathname.split("/")[1] || "home";
  return (
    <Routes location={location} key={key}>
      <Route path="/" element={<Page><Home /></Page>} />
      <Route
        path="/work/:slug"
        element={
          <Page>
            <Suspense fallback={<div className="min-h-screen" />}>
              <CaseStudy />
            </Suspense>
          </Page>
        }
      />
      <Route
        path="/legal/:doc"
        element={
          <Page>
            <Suspense fallback={<div className="min-h-screen" />}>
              <Legal />
            </Suspense>
          </Page>
        }
      />
      <Route
        path="/about"
        element={
          <Page>
            <Suspense fallback={<div className="min-h-screen" />}>
              <Profile doc="about" />
            </Suspense>
          </Page>
        }
      />
      <Route
        path="/contact"
        element={
          <Page>
            <Suspense fallback={<div className="min-h-screen" />}>
              <Profile doc="contact" />
            </Suspense>
          </Page>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  // No-ops unless the browser implements WebMCP; see the hook for why.
  useWebMcpTools();

  return (
    <>
      <ScrollManager />
      <ScrollProgress />
      {/* First focusable element on every page, so a keyboard user can skip
          the nav. The target needs tabIndex -1 or focus stays behind. */}
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
      >
        Skip to content
      </a>
      <Nav />
      <main id="top" tabIndex={-1} className="w-full max-w-full overflow-x-hidden outline-none">
        <AnimatedRoutes />
      </main>
      <Footer />
      {/* The nav's glass refraction filter: 5KB of SVG that no reader needs.
          The nav refers to it by id, so it works from anywhere in the
          document, and here it no longer sits in front of the first word of
          content for agents that read the HTML on a byte budget. */}
      <GlassFilter />
      {/* Outside the routes so Onee carries across navigation instead of being
          torn down and rebuilt — it is one character living on the site, not a
          decoration belonging to a page. */}
      <OneeCompanion />
    </>
  );
}
