import { useState, useEffect, useCallback } from "react";
import { LayoutGroup, AnimatePresence } from "framer-motion";
import PlainText from "./components/PlainText";
import WaterRipple from "./components/WaterRipple";

function App() {
  const [phase, setPhase] = useState("plain");

  useEffect(() => {
    if (phase !== "plain") return;
    const timer = setTimeout(() => setPhase("ripple"), 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleRippleComplete = useCallback(() => {
    setPhase("transform");
  }, []);

  return (
    <>
      <LayoutGroup>
        <PlainText transformed={phase === "transform"} />
      </LayoutGroup>
      <AnimatePresence>
        {phase === "ripple" && (
          <WaterRipple active={true} onComplete={handleRippleComplete} />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
