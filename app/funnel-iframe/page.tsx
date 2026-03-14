"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import FunnelCalculator from "./FunnelCalculator";
import FunnelContactForm from "./FunnelContactForm";


export default function FunnelIframePage() {
  const [step, setStep] = useState(1);
  const [calcData, setCalcData] = useState<any>(null);
  const searchParams = useSearchParams();
  const refSource = searchParams?.get("ref") || "";

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Mobile-first responsive wrapper */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
        {step === 1 && (
          <div className="relative min-h-[60vh] md:min-h-[80vh] flex flex-col justify-center">
            {/* Calculator Content */}
            <div className="w-full">
              <FunnelCalculator />
            </div>

            {/* Contact Button - Responsive positioning */}
            <div className="mt-8 sm:mt-10 md:mt-12 flex justify-center md:justify-end">
              <button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-[6px] 
                           bg-[#1A2A36] text-white font-medium text-base sm:text-base
                           hover:bg-[#223344] active:bg-[#0F1823]
                           transition-all duration-150 ease-in-out
                           shadow-sm hover:shadow-md
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A2A36]"
                style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
              >
                Kontakt aufnehmen
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full">
            {/* Back button for mobile */}
            <button
              onClick={() => setStep(1)}
              className="mb-6 text-sm font-medium text-[#1A2A36] hover:text-[#223344] transition-colors md:hidden"
            >
              ← Zurück zum Rechner
            </button>
            <FunnelContactForm refSource={refSource} />
          </div>
        )}
      </div>
    </div>
  );
}