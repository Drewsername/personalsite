import { motion } from "framer-motion";
import TiltCard from "./TiltCard";

const sections = [
  { id: "blog", label: "blog", desc: "writing about things" },
  { id: "book", label: "book", desc: "putting words in order" },
  { id: "built", label: "built", desc: "things i've made" },
  { id: "building", label: "building", desc: "things i'm making", link: "/building/AgentCompany/index.html", linkLabel: "AutoFoundry" },
];

export default function PlainText({ transformed }) {
  return (
    <motion.div
      layout
      className={`min-h-screen flex items-center transition-colors duration-1000 ${
        transformed ? "bg-[#0a0a0a]" : "bg-black"
      }`}
    >
      <div
        className={`w-full transition-all duration-700 ${
          transformed ? "max-w-5xl mx-auto px-4 sm:px-8" : "max-w-2xl mx-auto px-4 sm:px-6"
        }`}
      >
        <motion.div layout className="mb-12 pt-16 sm:pt-0">
          <motion.h1
            layout
            className={`transition-all duration-700 ${
              transformed
                ? "font-sans text-3xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-white"
                : "font-mono text-lg text-neutral-400 font-normal"
            }`}
            style={{ lineHeight: 1.1 }}
          >
            drew bermudez
            {!transformed && (
              <span className="cursor-blink text-neutral-600">_</span>
            )}
          </motion.h1>
          <motion.p
            layout
            className={`transition-all duration-700 ${
              transformed
                ? "font-sans text-lg text-neutral-400 mt-6 max-w-md leading-relaxed"
                : "font-mono text-sm text-neutral-600 mt-2"
            }`}
          >
            generalist and builder
          </motion.p>
        </motion.div>

        <motion.div
          layout
          className={`transition-all duration-700 ${
            transformed
              ? "grid grid-cols-1 md:grid-cols-2 gap-4"
              : "flex flex-col gap-1"
          }`}
        >
          {sections.map((section, i) => (
            <SectionItem
              key={section.id}
              section={section}
              index={i}
              transformed={transformed}
            />
          ))}
        </motion.div>

        {transformed ? (
          <motion.footer
            className="mt-16 pt-8 border-t border-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <p className="font-sans text-xs text-neutral-600">
              drew bermudez &mdash; 2026
            </p>
          </motion.footer>
        ) : (
          <motion.p
            className="font-mono text-xs text-neutral-700 mt-8"
            exit={{ opacity: 0 }}
          >
            last updated 2026
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

function SectionItem({ section, index, transformed }) {
  if (transformed) {
    return (
      <TiltCard className="group relative">
        <motion.a
          href={section.link || `#${section.id}`}
          className="block rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 h-full"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.15 + index * 0.12,
            type: "spring",
            stiffness: 80,
            damping: 18,
          }}
        >
          <h2 className="font-sans text-xl font-medium text-white mb-2">
            {section.label}
          </h2>
          <p className="font-sans text-sm text-neutral-500 leading-relaxed">
            {section.desc}
          </p>
          <div className="mt-4 flex items-center gap-1 text-neutral-600 text-xs font-sans">
            <span>coming soon</span>
            <svg
              className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </motion.a>
      </TiltCard>
    );
  }

  return (
    <motion.div layout className="font-mono text-sm">
      <span className="text-neutral-600">- </span>
      <a
        href={section.link || `#${section.id}`}
        className="text-neutral-400 hover:text-neutral-300 transition-colors"
      >
        {section.label}
      </a>
      {section.link && (
        <span className="text-neutral-700 ml-1">
          ({section.linkLabel})
        </span>
      )}
    </motion.div>
  );
}
