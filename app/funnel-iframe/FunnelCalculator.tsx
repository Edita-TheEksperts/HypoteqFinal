"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";


// Helper: Mindest-Einkommen nur für Zweitwohnsitz-Kauf (Annäherung wie Excel)
function getMinIncome(
  residenceType: "haupt" | "zweit",
  propertyPrice: number,
  ownFunds: number
) {
  if (residenceType === "haupt") return 0;

  // Zweitwohnsitz-Kauf:
  if (propertyPrice > 0 && ownFunds > 0) {
    const hypothek = propertyPrice - ownFunds;
    const kostenJahr = hypothek * (0.05 + 0.008); // 5% Zins + 0.8% Unterhalt
    return kostenJahr / 0.35; // 35% Tragbarkeitsschwelle
  }
  return 0;
}

export default function Calculator() {


  // Basis-States
  const [propertyPrice, setPropertyPrice] = useState(0); // Kaufpreis / Immobilienwert (B8)
  const [ownFunds, setOwnFunds] = useState(0); // Eigenmittel (B9)
  const [income, setIncome] = useState(0); // Brutto-Haushaltseinkommen p.a. (B11)

  // Refinanzierung
  const [existingMortgage, setExistingMortgage] = useState(0); // B9: Bisherige Hypothek
  const [mortgageIncrease, setMortgageIncrease] = useState(0); // B10: Hypothekerhoehung

  const [loanType, setLoanType] = useState<"refinancing" | "purchase">("refinancing");
  const [residenceType, setResidenceType] = useState<"haupt" | "zweit">("haupt");


  const [interestLabels, setInterestLabels] = useState<string[]>([]);
  const [interestRates, setInterestRates] = useState<number[]>([]);
  const [interestOptionIndex, setInterestOptionIndex] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(false);

  // Default params (should match your business logic)
  const params = {
    maxBelehnung: 0.8,
    firstMortgageLimit: 0.6667,
    amortizationYears: 15,
    maintenanceRate: 0.008,
  };

  // Dynamic max mortgage for slider (can be customized)
  const dynamicMaxMortgage = params.maxBelehnung * propertyPrice;

  useEffect(() => {
      fetch("/api/interest")
        .then((res) => res.json())
        .then((data) => {
          // data: [{ rate, position }]
          const staticLabels = [
            "SARON",
            "1Y",
            "2Y",
            "3Y",
            "4Y",
            "5Y",
            "6Y",
            "7Y",
            "8Y",
            "9Y",
            "10Y"
          ];
          if (Array.isArray(data)) {
            setInterestLabels(
              data.map((item: any, idx: number) => {
                const label = staticLabels[item.position ?? idx] || `Option ${idx+1}`;
                // Format: SARON 0.90%, 1Y 0.97%, etc.
                return `${label} ${(item.rate * 100).toFixed(2)}%`;
              })
            );
            setInterestRates(data.map((item: any) => item.rate));
          }
        });
    }, []);

  const effectiveRate = useMemo(() => {
    if (interestRates.length > 0 && interestOptionIndex >= 0 && interestOptionIndex < interestRates.length) {
      return interestRates[interestOptionIndex];
    }
    return 0.01;
  }, [interestRates, interestOptionIndex]);

  // --- Hypothekenbeträge Kauf / Refi ---

  // Kauf: Total-Hypothek wie B51 = Kaufpreis - Eigenmittel
  const totalMortgagePurchase = Math.max(0, propertyPrice - ownFunds);

  // Refi: Total-Hypothek si në Excel = B9 + B10
  const totalMortgageRefi = Math.max(0, existingMortgage + mortgageIncrease);

  // Për të gjitha llogaritjet (Tragbarkeit dhe Monatskosten)
  const totalMortgageForCalc =
    loanType === "purchase" ? totalMortgagePurchase : totalMortgageRefi;

  // Max. erlaubte Hypothek für Eligibility (B14/B22)
  const maxMortgageAllowed = params.maxBelehnung * propertyPrice;
  const mortgageNeed =
    loanType === "purchase" ? totalMortgagePurchase : totalMortgageRefi;
  const totalMortgageCapped = Math.min(mortgageNeed, maxMortgageAllowed);

  // --- EXPLICIT LTV CALCULATION ---
  // LTV = Total Mortgage / Property Value
  const ltv = propertyPrice > 0 ? totalMortgageForCalc / propertyPrice : 0;
  
  // LTV Limit based on residence type
  const ltvLimit = residenceType === "haupt" ? 0.8 : 0.65;
  
  // LTV Check - independent rule
  const ltvOk = ltv <= ltvLimit;

  // 1. und 2. Hypothek (nur für Kauf + Hauptwohnsitz relevant)
  const firstLimitAbs =
    residenceType === "haupt"
      ? params.firstMortgageLimit * propertyPrice // B52 = B15*B8
      : 0;

  // B53 = B51-B52 (nicht negativ)
  const secondMortgage =
    residenceType === "haupt"
      ? Math.max(0, totalMortgageForCalc - firstLimitAbs)
      : 0;

  // Amortisationsrate wie (B14-B15)/B18
  const amortizationRate =
    residenceType === "haupt" && params.amortizationYears > 0
      ? (params.maxBelehnung - params.firstMortgageLimit) /
        params.amortizationYears
      : 0;

  // --- AFFORDABILITY CALCULATION (STRESS INTEREST ONLY) ---
  // MUST use stress interest (5%) for eligibility, NOT product interest
  
  let affordability = 0;
  let affordabilityCHF = 0;

  if (residenceType === "haupt") {
    // Primary residence: includes amortisation
    affordabilityCHF = totalMortgageForCalc * (0.05 + 0.008 + ((0.8 - 0.6667) / 15));
  } else {
    // Secondary residence: no amortisation
    affordabilityCHF = totalMortgageForCalc * (0.05 + 0.008);
  }
  
  affordability = income > 0 ? affordabilityCHF / income : 0;
  
  // Affordability Check - independent rule
  // Should be OK only if there's income AND affordability is within limit
  const affordabilityOk = income > 0 && affordability <= 0.35;
  
  const minIncomeRequired =
    affordabilityCHF > 0 ? Math.ceil(affordabilityCHF / 0.35) : 0;

  // Minimum-Eigenmittel (Kauf)
  const minOwnFunds =
    loanType === "purchase"
      ? propertyPrice *
        (residenceType === "zweit" ? 0.35 : 0.2) // 35%/20%
      : 0;

  const isEquityOK =
    loanType === "purchase" ? (propertyPrice > 0 && ownFunds >= minOwnFunds) : true;

  // --- TOP BOX AGGREGATOR ONLY ---
  // eligible is ONLY an aggregation of independent checks
  const isEligible = ltvOk && affordabilityOk && isEquityOK;
  
  // Keep legacy variables for backward compatibility in UI
  const tragbarkeitPercent = affordability;
  const tragbarkeitCHF = affordabilityCHF;
  const isTragbarkeitOK = affordabilityOk;
  const isBelehnungOK = ltvOk;
  const belehnung = ltv;
  const belehnungPurchase = propertyPrice > 0 ? totalMortgagePurchase / propertyPrice : 0;
  const belehnungRefi = propertyPrice > 0 ? totalMortgageRefi / propertyPrice : 0;

  // --- MONTHLY COSTS (PRODUCT INTEREST RATE) ---
  // Monthly costs MUST use effectiveRate (product interest), NOT stress rate
  // Changing SARON/5Y/10Y should ONLY affect monthly costs, NOT affordability

  // Maintenance costs = 0.8% of property value
  const maintenanceYear = propertyPrice * params.maintenanceRate;
  const monthlyMaintenance = maintenanceYear / 12;

  // For refinancing - old monthly cost
  const secondMortgageOld =
    residenceType === "haupt"
      ? Math.max(0, existingMortgage - firstLimitAbs)
      : 0;
  const oldAmortYear =
    residenceType === "haupt" && params.amortizationYears > 0
      ? Math.max(0, secondMortgageOld / params.amortizationYears)
      : 0;

  const oldInterestYear = existingMortgage * effectiveRate; // Product interest
  const oldMaintenanceYear = propertyPrice * params.maintenanceRate;
  const monthlyOld = (oldInterestYear + oldMaintenanceYear + oldAmortYear) / 12;

  // For refinancing - new monthly cost
  const newTotal = totalMortgageRefi;
  const newInterestYear = newTotal * effectiveRate; // Product interest
  const newMaintenanceYear = propertyPrice * params.maintenanceRate;
  const newSecondMortgage =
    residenceType === "haupt"
      ? Math.max(0, newTotal - firstLimitAbs)
      : 0;
  const newAmortYear =
    residenceType === "haupt" && params.amortizationYears > 0
      ? Math.max(0, newSecondMortgage / params.amortizationYears)
      : 0;
  const monthlyNew = (newInterestYear + newMaintenanceYear + newAmortYear) / 12;

  // General monthly costs (purchase or refinancing)
  const interestYearEffective = totalMortgageForCalc * effectiveRate; // Product interest
  const monthlyInterest = interestYearEffective / 12;
  
  const amortizationYear =
    residenceType === "haupt" && params.amortizationYears > 0
      ? Math.max(0, secondMortgage / params.amortizationYears)
      : 0;
  const monthlyAmortization = amortizationYear / 12;
  
  // Total monthly cost with product interest
  const monthlyCost = monthlyInterest + monthlyMaintenance + monthlyAmortization;

  // Slider-Visual-Limits
  const minVisualMax = 100000;
  const sliderMaxExisting = Math.max(propertyPrice, minVisualMax);
  const sliderMaxNew = Math.max(dynamicMaxMortgage, minVisualMax);

  const infoTitle = isEligible
    ? loanType === "purchase"
      ? "Finanzierung möglich (Kauf)"
      : "Finanzierung möglich (Refinanzierung)"
    : "Finanzierung nicht möglich";

  // Formatting
  const formatCHF = (num: number) =>
    "CHF " + Math.round(num).toLocaleString("de-CH");
  const formatPercent = (num: number) =>
    (num * 100).toFixed(1).replace(".", ",") + "%";

  // UI
  return (
    <section
      id="calculator"
      className="flex flex-col items-center bg-white py-10 px-4 sm:py-16 sm:px-8 md:px-12 lg:px-[116px] min-h-screen font-sans text-[#222]"
    >
      <div className="max-w-full lg:max-w-[900px] w-full mx-auto">
        <div className="flex flex-col mb-8">
          {/* Loan type dropdown */}
          <div className="mb-4 w-full max-w-xs">
            <label className="block text-[20px] font-semibold mb-2">{loanType === "refinancing" ? "Refinanzierung" : "Immobilienkauf"}</label>
            <select
              className="w-full border border-[#D1D5DB] rounded-[6px] px-4 py-2 text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-[#222]"
              value={loanType}
              onChange={e => setLoanType(e.target.value as "refinancing" | "purchase")}
            >
              <option value="refinancing">Refinanzierung</option>
              <option value="purchase">Immobilienkauf</option>
            </select>
          </div>
          {/* Residence type toggles */}
          <div className="flex gap-2 mb-8">
            <button
              className={`px-5 py-2 rounded-[6px] border text-[15px] font-medium transition-all duration-200 ${residenceType === "haupt" ? "bg-[#222] text-white border-[#222]" : "bg-white text-[#222] border-[#D1D5DB] hover:bg-[#F3F4F6]"}`}
              onClick={() => setResidenceType("haupt")}
            >Hauptwohnsitz</button>
            <button
              className={`px-5 py-2 rounded-[6px] border text-[15px] font-medium transition-all duration-200 ${residenceType === "zweit" ? "bg-[#222] text-white border-[#222]" : "bg-white text-[#222] border-[#D1D5DB] hover:bg-[#F3F4F6]"}`}
              onClick={() => setResidenceType("zweit")}
            >Zweitwohnsitz</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SliderInput label="Kaufpreis / Immobilienwert" value={propertyPrice} setValue={setPropertyPrice} min={0} max={5000000} />
            <SliderInput label="Bisherige Hypothek" value={existingMortgage} setValue={setExistingMortgage} min={0} max={propertyPrice} />
            <SliderInput label="Hypothekenerhöhung" value={mortgageIncrease} setValue={setMortgageIncrease} min={0} max={params.maxBelehnung * propertyPrice} />
            <SliderInput label="Brutto-Haushaltseinkommen" value={income} setValue={setIncome} min={0} max={10000000} />
            <div className="col-span-1 md:col-span-2">
              <div className="flex flex-col gap-2">
                <label className="text-[15px] font-semibold mb-1">Zins-Laufzeit wählen</label>
                <div className="relative w-full">
                  <button
                    onClick={() => setOpenDropdown((prev) => !prev)}
                    className="w-full h-[44px] bg-white border border-[#D1D5DB] rounded-[6px] flex items-center justify-between px-[16px] text-[16px] font-normal focus:outline-none focus:ring-2 focus:ring-[#222]"
                  >
                    <span className="text-[#222]">{interestLabels[interestOptionIndex]}</span>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className={`transition-transform duration-300 ${openDropdown ? "rotate-180" : "rotate-0"}`}> <path d="M5 7L10 12L15 7" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> </svg>
                  </button>
                  {openDropdown && (
                    <div className="absolute left-0 top-[45px] w-full bg-white border border-[#D1D5DB] rounded-[8px] shadow-lg z-[9999] py-2" style={{zIndex: 9999}}>
                      {interestLabels.map((label, idx) => (
                        <button key={label} className="w-full text-left px-4 py-2 text-[16px] text-[#222] hover:bg-[#F3F4F6]" onClick={() => { setInterestOptionIndex(idx); setOpenDropdown(false); }}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] shadow p-8 mt-4 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="text-[#222] text-[15px] font-medium mb-1">Finanzierung möglich. Neue Hypothek bis:</div>
              <div className="text-[26px] font-bold">{formatCHF(totalMortgageForCalc)}</div>
            </div>
            <div>
              <div className="text-[#222] text-[15px] font-medium mb-1">Belehnung</div>
              <div className="text-[26px] font-bold">{formatPercent(belehnungRefi)}</div>
            </div>
            <div>
              <div className="text-[#222] text-[15px] font-medium mb-1">Tragbarkeit</div>
              <div className="text-[26px] font-bold">{formatPercent(tragbarkeitPercent)}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="text-[#222] text-[15px] font-medium mb-1">Bisherige monatliche Kosten</div>
              <div className="text-[22px] font-semibold">{formatCHF(monthlyOld)}</div>
            </div>
            <div>
              <div className="text-[#222] text-[15px] font-medium mb-1">Monatliche Gesamtkosten</div>
              <div className="text-[22px] font-semibold">{formatCHF(monthlyNew)}</div>
            </div>
            <div>
              <div className="text-[#222] text-[15px] font-medium mb-1">Zinsen</div>
              <div className="text-[22px] font-semibold">{formatCHF(monthlyInterest)}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="text-[#222] text-[15px] font-medium mb-1">Unterhalt / Nebenkosten</div>
              <div className="text-[22px] font-semibold">{formatCHF(monthlyMaintenance)}</div>
            </div>
          </div>
          {/* Risk Assessment Bar */}
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="bg-[#F3F4F6] text-[#222] text-xs font-semibold px-3 py-1 rounded-full border border-[#D1D5DB]">Mortgage assessment</span>
              <span className="text-[#222] text-[15px]">Your eligibility, affordability, and available equity are all within a healthy range, indicating a low financial risk.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToggleButton({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-[40px] rounded-full border border-[#132219] text-[18px] font-medium transition-all duration-300 ${
        active
          ? "bg-[linear-gradient(270deg,#CAF476_0%,#E3F4BF_100%)]"
          : "bg-white opacity-80"
      }`}
    >
      {label}
    </button>
  );
}

function SubToggle({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex justify-center items-center h-[40px] rounded-[48px] text-[18px] font-semibold transition-all duration-300 ${
        active
          ? "bg-[#132219] text-[#CAF47E]"
          : "bg-transparent text-[#132219] opacity-70"
      }`}
    >
      {label}
    </button>
  );
}

function SliderInput({ label, value, setValue, min, max, minRequired }: any) {
  // Always use 0 as the actual minimum for the slider
  const sliderMin = 0;
  const percentage = max > sliderMin ? ((value - sliderMin) / (max - sliderMin)) * 100 : 0;
  const [inputValue, setInputValue] = useState(value.toLocaleString("de-CH"));
  const [isFocused, setIsFocused] = useState(false);

  // Sync inputValue with value when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toLocaleString("de-CH"));
    }
  }, [value, isFocused]);

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div className="flex flex-col gap-[6px] relative">
      <div className="flex justify-between items-center">
        <label className="text-[16px] font-medium">{label}</label>
        <div className="w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[#626D64]">
          <span className="text-white text-[10px] font-medium">?</span>
        </div>
      </div>

      <div className="flex items-center justify-between border border-[#A8A8A8] rounded-full px-5 py-2">
        <input
          type="text"
          value={inputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            const raw = inputValue.replace(/[^0-9]/g, "");
            const parsed = Number(raw);
            if (!isNaN(parsed) && parsed >= 0) {
              // Allow any value from 0 to max, don't enforce minRequired
              const bounded = Math.max(0, Math.min(parsed, max));
              setValue(bounded);
              setInputValue(bounded.toLocaleString("de-CH"));
            } else {
              setInputValue(value.toLocaleString("de-CH"));
            }
          }}
          onChange={(e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            
            // Update value in real-time as user types
            const raw = newValue.replace(/[^0-9]/g, "");
            const parsed = Number(raw);
            if (!isNaN(parsed) && parsed >= 0) {
              const bounded = Math.max(0, Math.min(parsed, max));
              setValue(bounded);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="bg-transparent text-[18px] font-medium w-[120px] outline-none"
        />
        <span className="text-[18px] font-semibold">CHF</span>
      </div>

      <input
        type="range"
        min={sliderMin}
        max={max}
        value={value}
        onMouseDown={() => {
          if (isFocused) {
            setIsFocused(false);
          }
        }}
        onChange={(e) => {
          let newVal = Number(e.target.value);
          // Only apply 5000 step for Kaufpreis / Immobilienwert
          if (label && label.toLowerCase().includes("kaufpreis")) {
            newVal = Math.round(newVal / 5000) * 5000;
          }
          // Don't enforce minRequired here, just set the value
          setValue(newVal);
        }}
        className="w-full h-[4px] rounded-full appearance-none cursor-pointer transition-[background] duration-300 ease-out mt-[6px]"
        style={{
          background: `linear-gradient(to right, #132219 ${Math.max(
            percentage,
            3
          )}%, #D9D9D9 ${Math.max(percentage, 3)}%)`,
          transition: "all 0.3s ease-out",
        }}
      />

      {minRequired !== undefined ? (
        <div className="flex justify-end text-[13px] text-[#4b4b4b] italic pr-2 mt-[-4px] h-[18px]">
          Minimum: {Math.round(minRequired).toLocaleString("de-CH")} CHF
        </div>
      ) : (
        <div className="h-[18px]" />
      )}
    </div>
  );
}

function InfoBox({ title, value, red = false }: any) {
  const bgColor = red
    ? "bg-[linear-gradient(270deg,#FCA5A5_0%,#FECACA_100%)]"
    : "bg-[linear-gradient(270deg,#CAF476_0%,#E3F4BF_100%)]";

  return (
    <div
      className={`flex flex-col justify-between w-full h-[185px] 
      border border-[#132219] rounded-[10px] 
      px-[16px] py-[12px] ${bgColor}`}
    >
      <div className="flex justify-between items-start">
        <p className="text-[16px] font-medium leading-tight">{title}</p>

        <div className={`w-[20px] h-[20px] rounded-full border border-[#132219] flex items-center justify-center ${red ? 'bg-[#FF9A9A]' : 'bg-[#CAF47E]'}`}>
          {red ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3L3 9M3 3L9 9" stroke="#132219" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <CheckIcon />
          )}
        </div>
      </div>

      <h2 className="text-[40px] font-semibold tracking-tight leading-none">
        {value}
      </h2>
    </div>
  );
}

function ProgressBox({
  title,
  value,
  current,
  total,
  red = false,
  thresholdLabel,
}: any) {
  const bgColor = red
    ? "bg-[linear-gradient(270deg,#FCA5A5_0%,#FECACA_100%)]"
    : "bg-[linear-gradient(270deg,#CAF476_0%,#E3F4BF_100%)]";
  
  const iconBgColor = red ? "bg-[#FF9A9A]" : "bg-[#CAF47E]";

  return (
    <div
      className={`
      flex-1 h-[185px]
      flex flex-col justify-between 
      rounded-[10px] border border-[#132219] 
      px-[16px] py-[15px]
      ${bgColor}
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h3 className="text-[20px]">{title}</h3>
          {thresholdLabel && (
            <span className="hidden text-[13px] text-[#4b4b4b]">{thresholdLabel}</span>
          )}
        </div>
        <div className={`w-[20px] h-[20px] rounded-full border border-[#132219] ${iconBgColor} flex items-center justify-center`}>
          {red ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3L3 9M3 3L9 9" stroke="#132219" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <CheckIcon />
          )}
        </div>
      </div>

      <h2 className="text-[40px] font-semibold leading-none">{value}</h2>
      <p className="hidden text-[13px] text-[#4b4b4b]">
        {current} / {total}
      </p>
    </div>
  );
}

interface SmallBoxProps {
  title: string;
  value: string;
  highlight?: boolean;
}

function SmallBox({ title, value, highlight = false }: SmallBoxProps) {
  const [currency, amount] = value.split(" ");

  return (
    <div
      className={`
        relative flex flex-col justify-between
        w-full h-[127px]
        p-[8px_12px]
        rounded-[10px] border border-[#132219]
        bg-white overflow-hidden
      `}
    >
      {highlight && (
        <div className="absolute bottom-0 left-0 w-full h-[4px] bg-[linear-gradient(270deg,#CAF476_0%,#E3F4BF_100%)]" />
      )}

      <p className="text-[14px] font-medium text-[#132219] leading-none">
        {title}
      </p>

      <div className="flex items-end gap-[3px] mt-[4px]">
        <span className="text-[20px] font-semibold">{currency}</span>
        <span className="text-[20px] font-semibold">{amount}</span>
      </div>
    </div>
  );
}

function CheckIcon({ red = false }: any) {
  const strokeColor = red ? "#7F1D1D" : "#132219";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="8"
      height="6"
      viewBox="0 0 10 8"
      fill="none"
    >
      <path
        d="M0.5 3.78129L3.31254 6.59383L9.50012 0.40625"
        stroke={strokeColor}
        strokeWidth="1"
      />
    </svg>
  );
}