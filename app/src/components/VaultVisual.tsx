"use client";
import { motion } from "framer-motion";

interface Props { initialized: boolean; loading: boolean; }

export default function VaultVisual({ initialized, loading }: Props) {
  return (
    <motion.div
      className="relative w-40 h-40 mx-auto"
      whileHover={{ scale: 1.03 }}
      animate={loading ? { rotate: [0, -1.5, 1.5, -1.5, 0] } : {}}
      transition={{ duration: 0.5, repeat: loading ? Infinity : 0 }}
    >
      {/* Ambient glow — subtle, not overdone */}
      <div className="absolute inset-4 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="absolute inset-8 rounded-full bg-indigo-500/10 blur-2xl" />

      <svg viewBox="0 0 120 120" className="w-full h-full relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer frame */}
        <rect x="10" y="18" width="100" height="84" rx="12" fill="#0D1117" stroke="#2E1065" strokeWidth="1.5"/>
        
        {/* Inner panel with subtle gradient */}
        <rect x="16" y="24" width="88" height="72" rx="8" fill="url(#panelGrad)" stroke="rgba(139,92,246,0.2)" strokeWidth="1"/>
        
        {/* Door */}
        <motion.g
          animate={initialized ? { opacity: [1, 0.8, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="24" y="32" width="72" height="56" rx="6" fill="#151B27" stroke="rgba(139,92,246,0.25)" strokeWidth="1"/>
        </motion.g>

        {/* Handle ring */}
        <circle cx="60" cy="60" r="14" fill="none" stroke="#7C3AED" strokeWidth="2" opacity="0.7"/>
        <circle cx="60" cy="60" r="9" fill="none" stroke="#6D28D9" strokeWidth="1.5" opacity="0.4"/>
        <circle cx="60" cy="60" r="3.5" fill="#8B5CF6" opacity="0.9"/>
        
        {/* Handle spokes */}
        <line x1="60" y1="46" x2="60" y2="51" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <line x1="60" y1="69" x2="60" y2="74" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <line x1="46" y1="60" x2="51" y2="60" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <line x1="69" y1="60" x2="74" y2="60" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>

        {/* Corner bolts — refined with subtle detail */}
        {[[30, 38], [90, 38], [30, 82], [90, 82]].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="3" fill="#1E1B4B" stroke="#4C1D95" strokeWidth="1" />
            <circle cx={cx} cy={cy} r="1" fill="#6D28D9" opacity="0.6" />
          </g>
        ))}

        {/* Keyhole detail */}
        <rect x="57" y="65" width="6" height="4" rx="1" fill="#4C1D95" opacity="0.5"/>

        {/* Active status ring */}
        {initialized && (
          <motion.circle
            cx="60" cy="60" r="38"
            fill="none" stroke="#8B5CF6" strokeWidth="0.5"
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{ opacity: [0.3, 0.1, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <defs>
          <linearGradient id="panelGrad" x1="16" y1="24" x2="104" y2="96" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E1B4B" stopOpacity="0.4"/>
            <stop offset="1" stopColor="#0D1117" stopOpacity="0.8"/>
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}
