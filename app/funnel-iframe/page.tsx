"use client";
import { useState } from "react";
import FunnelCalculator from "./FunnelCalculator";
import FunnelContactForm from "./FunnelContactForm";

export default function FunnelIframePage() {
  const [step, setStep] = useState(1);
  const [calcData, setCalcData] = useState<any>(null);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", background: "#fff", padding: 24, borderRadius: 12 }}>
      {step === 1 && (
        <div className="relative min-h-[60vh] flex flex-col justify-center items-center">
          <FunnelCalculator />
          <button
            onClick={() => setStep(2)}
            className="fixed md:absolute bottom-8 right-8 md:bottom-8 md:right-8 z-50 bg-[#1A2A36] text-white px-8 py-3 rounded-[6px] shadow text-[16px] font-medium hover:bg-[#223344] transition-colors duration-150"
            style={{ fontFamily: "'SF Pro Display', Inter, sans-serif", minWidth: 160 }}
          >
            Kontakt aufnehmen
          </button>
        </div>
      )}
      {step === 2 && (
        <FunnelContactForm />
      )}
    </div>
  );
}
