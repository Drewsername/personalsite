import { useState, useEffect, useCallback } from "react";
import { LayoutGroup, AnimatePresence } from "framer-motion";
import PlainText from "./components/PlainText";
import WaterRipple from "./components/WaterRipple";

function App() {
  const [phase, setPhase] = useState("plain");
  const [transformed, setTransformed] = useState(false);

  useEffect(() => {
    if (phase !== "plain") return;
    const timer = setTimeout(() => setPhase("ripple"), 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  // Layout swap at peak distortion — content is too warped to see the change
  const handlePeakDistortion = useCallback(() => {
    setTransformed(true);
  }, []);

  const handleRippleComplete = useCallback(() => {
    setPhase("done");
  }, []);

  const isRippling = phase === "ripple";

  return (
    <>
      {/* WaterRipple always rendered so SVG filter element stays in DOM */}
      <WaterRipple
        active={isRippling}
        onPeakDistortion={handlePeakDistortion}
        onComplete={handleRippleComplete}
      />
      <div
        style={isRippling ? { filter: "url(#water-distort)" } : undefined}
        className="transition-[filter] duration-300"
      >
        <LayoutGroup>
          <PlainText transformed={transformed} />
        </LayoutGroup>
      </div>
    </>
  );
}

export default App;
