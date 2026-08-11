import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import ScrollProgress from "./components/ScrollProgress";
import Home from "./pages/Home";
import { useWebMcpTools } from "./lib/useWebMcpTools";

// Case study + legal live behind routes the landing page never needs up front,
// so they are code-split — the initial bundle stays lean.
const CaseStudy = lazy(() => import("./pages/CaseStudy"));
const Legal = lazy(() => import("./pages/Legal"));

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
function Page({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}

function AnimatedRoutes() {
  const location = useLocation();
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
      <Nav />
      <main id="top" className="w-full max-w-full overflow-x-hidden">
        <AnimatedRoutes />
      </main>
      <Footer />
    </>
  );
}
