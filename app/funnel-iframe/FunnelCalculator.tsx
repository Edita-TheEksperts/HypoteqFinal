"use client";

import { useState, useMemo, useEffect } from "react";

// Helper: Mindest-Einkommen nur für Zweitwohnsitz-Kauf
function getMinIncome(
  residenceType: "haupt" | "zweit",
  propertyPrice: number,
  ownFunds: number
) {
  if (residenceType === "haupt") return 0;
  if (propertyPrice > 0 && ownFunds > 0) {
    const hypothek = propertyPrice - ownFunds;
    const kostenJahr = hypothek * (0.05 + 0.008);
    return kostenJahr / 0.35;
  }
  return 0;
}

export default function Calculator() {
  // Basis-States
  const [propertyPrice, setPropertyPrice] = useState(400000);
  const [ownFunds, setOwnFunds] = useState(80000);
  const [income, setIncome] = useState(150000);

  // Refinanzierung
  const [existingMortgage, setExistingMortgage] = useState(250000);
  const [mortgageIncrease, setMortgageIncrease] = useState(50000);

  const [loanType, setLoanType] = useState<"refinancing" | "purchase">("refinancing");
  const [residenceType, setResidenceType] = useState<"haupt" | "zweit">("haupt");

  const [interestLabels, setInterestLabels] = useState<string[]>([]);
  const [interestRates, setInterestRates] = useState<number[]>([]);
  const [interestOptionIndex, setInterestOptionIndex] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(false);

  const params = {
    maxBelehnung: 0.8,
    firstMortgageLimit: 0.6667,
    amortizationYears: 15,
    maintenanceRate: 0.008,
  };

  const dynamicMaxMortgage = params.maxBelehnung * propertyPrice;

  useEffect(() => {
    fetch("/api/interest")
      .then((res) => res.json())
      .then((data) => {
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
              const label = staticLabels[item.position ?? idx] || `Option ${idx + 1}`;
              return `${label} ${(item.rate * 100).toFixed(2)}%`;
            })
          );
          setInterestRates(data.map((item: any) => item.rate));
        }
      })
      .catch(() => {
        // Fallback rates
        const fallbackLabels = ["SARON 1.20%", "1Y 1.35%", "5Y 1.65%", "10Y 1.85%"];
        const fallbackRates = [0.012, 0.0135, 0.0165, 0.0185];
        setInterestLabels(fallbackLabels);
        setInterestRates(fallbackRates);
      });
  }, []);

  const effectiveRate = useMemo(() => {
    if (interestRates.length > 0 && interestOptionIndex >= 0 && interestOptionIndex < interestRates.length) {
      return interestRates[interestOptionIndex];
    }
    return 0.01;
  }, [interestRates, interestOptionIndex]);

  const totalMortgagePurchase = Math.max(0, propertyPrice - ownFunds);
  const totalMortgageRefi = Math.max(0, existingMortgage + mortgageIncrease);
  const totalMortgageForCalc = loanType === "purchase" ? totalMortgagePurchase : totalMortgageRefi;

  const ltv = propertyPrice > 0 ? totalMortgageForCalc / propertyPrice : 0;
  const ltvLimit = residenceType === "haupt" ? 0.8 : 0.65;
  const ltvOk = ltv <= ltvLimit;

  const firstLimitAbs = residenceType === "haupt" ? params.firstMortgageLimit * propertyPrice : 0;
  const secondMortgage = residenceType === "haupt" ? Math.max(0, totalMortgageForCalc - firstLimitAbs) : 0;

  const amortizationRate = residenceType === "haupt" && params.amortizationYears > 0
    ? (params.maxBelehnung - params.firstMortgageLimit) / params.amortizationYears
    : 0;

  let affordabilityCHF = 0;
  if (residenceType === "haupt") {
    affordabilityCHF = totalMortgageForCalc * (0.05 + 0.008 + ((0.8 - 0.6667) / 15));
  } else {
    affordabilityCHF = totalMortgageForCalc * (0.05 + 0.008);
  }

  const affordability = income > 0 ? affordabilityCHF / income : 0;
  const affordabilityOk = income > 0 && affordability <= 0.35;
  const minIncomeRequired = affordabilityCHF > 0 ? Math.ceil(affordabilityCHF / 0.35) : 0;

  const minOwnFunds = loanType === "purchase"
    ? propertyPrice * (residenceType === "zweit" ? 0.35 : 0.2)
    : 0;

  const isEquityOK = loanType === "purchase" ? (propertyPrice > 0 && ownFunds >= minOwnFunds) : true;
  const isEligible = ltvOk && affordabilityOk && isEquityOK;

  const tragbarkeitPercent = affordability;
  const belehnungRefi = propertyPrice > 0 ? totalMortgageRefi / propertyPrice : 0;

  // Monthly costs with product interest rate
  const maintenanceYear = propertyPrice * params.maintenanceRate;
  const monthlyMaintenance = maintenanceYear / 12;

  const secondMortgageOld = residenceType === "haupt"
    ? Math.max(0, existingMortgage - firstLimitAbs)
    : 0;
  const oldAmortYear = residenceType === "haupt" && params.amortizationYears > 0
    ? Math.max(0, secondMortgageOld / params.amortizationYears)
    : 0;

  const oldInterestYear = existingMortgage * effectiveRate;
  const oldMaintenanceYear = propertyPrice * params.maintenanceRate;
  const monthlyOld = (oldInterestYear + oldMaintenanceYear + oldAmortYear) / 12;

  const newTotal = totalMortgageRefi;
  const newInterestYear = newTotal * effectiveRate;
  const newMaintenanceYear = propertyPrice * params.maintenanceRate;
  const newSecondMortgage = residenceType === "haupt"
    ? Math.max(0, newTotal - firstLimitAbs)
    : 0;
  const newAmortYear = residenceType === "haupt" && params.amortizationYears > 0
    ? Math.max(0, newSecondMortgage / params.amortizationYears)
    : 0;
  const monthlyNew = (newInterestYear + newMaintenanceYear + newAmortYear) / 12;

  const interestYearEffective = totalMortgageForCalc * effectiveRate;
  const monthlyInterest = interestYearEffective / 12;

  const amortizationYear = residenceType === "haupt" && params.amortizationYears > 0
    ? Math.max(0, secondMortgage / params.amortizationYears)
    : 0;
  const monthlyAmortization = amortizationYear / 12;
  const monthlyCost = monthlyInterest + monthlyMaintenance + monthlyAmortization;

  const formatCHF = (num: number) => "CHF " + Math.round(num).toLocaleString("de-CH");
  const formatPercent = (num: number) => (num * 100).toFixed(1).replace(".", ",") + "%";

  return (
    <section className="w-full bg-white py-6 px-4 sm:py-8 sm:px-6 md:py-12 md:px-8 lg:py-16 lg:px-12 min-h-screen font-sans text-[#222]">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <select
              className="w-full sm:w-auto border border-[#D1D5DB] rounded-[6px] px-4 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#222]"
              value={loanType}
              onChange={(e) => setLoanType(e.target.value as "refinancing" | "purchase")}
            >
              <option value="refinancing">Refinanzierung</option>
              <option value="purchase">Immobilienkauf</option>
            </select>
          </div>

          {/* Residence Type Toggle */}
          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-4 sm:px-5 py-2 rounded-[6px] border text-sm sm:text-base font-medium transition-all duration-200 ${
                residenceType === "haupt"
                  ? "bg-[#222] text-white border-[#222]"
                  : "bg-white text-[#222] border-[#D1D5DB] hover:bg-[#F3F4F6]"
              }`}
              onClick={() => setResidenceType("haupt")}
            >
              Hauptwohnsitz
            </button>
            <button
              className={`px-4 sm:px-5 py-2 rounded-[6px] border text-sm sm:text-base font-medium transition-all duration-200 ${
                residenceType === "zweit"
                  ? "bg-[#222] text-white border-[#222]"
                  : "bg-white text-[#222] border-[#D1D5DB] hover:bg-[#F3F4F6]"
              }`}
              onClick={() => setResidenceType("zweit")}
            >
              Zweitwohnsitz
            </button>
          </div>
        </div>

        {/* Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 md:mb-12">
          <SliderInput
            label="Kaufpreis / Immobilienwert"
            value={propertyPrice}
            setValue={setPropertyPrice}
            min={0}
            max={5000000}
          />
          <SliderInput
            label="Bisherige Hypothek"
            value={existingMortgage}
            setValue={setExistingMortgage}
            min={0}
            max={propertyPrice}
          />
          <SliderInput
            label="Hypothekererhöhung"
            value={mortgageIncrease}
            setValue={setMortgageIncrease}
            min={0}
            max={params.maxBelehnung * propertyPrice}
          />
          <SliderInput
            label="Eigenmittel"
            value={ownFunds}
            setValue={setOwnFunds}
            min={0}
            max={propertyPrice}
          />
          <SliderInput
            label="Brutto-Haushaltseinkommen"
            value={income}
            setValue={setIncome}
            min={0}
            max={10000000}
          />

          {/* Interest Rate Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-sm sm:text-base font-semibold">Zins-Laufzeit wählen</label>
            <div className="relative w-full">
              <button
                onClick={() => setOpenDropdown((prev) => !prev)}
                className="w-full h-[44px] bg-white border border-[#D1D5DB] rounded-[6px] flex items-center justify-between px-4 text-sm sm:text-base font-normal focus:outline-none focus:ring-2 focus:ring-[#222]"
              >
                <span className="text-[#222] truncate">
                  {interestLabels[interestOptionIndex] || "Wähle Zins-Option"}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className={`transition-transform duration-300 flex-shrink-0 ${
                    openDropdown ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <path
                    d="M5 7L10 12L15 7"
                    stroke="#222"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {openDropdown && (
                <div className="absolute left-0 top-[50px] w-full bg-white border border-[#D1D5DB] rounded-[8px] shadow-lg z-50 py-2 max-h-[300px] overflow-y-auto">
                  {interestLabels.map((label, idx) => (
                    <button
                      key={label}
                      className="w-full text-left px-4 py-3 text-sm sm:text-base text-[#222] hover:bg-[#F3F4F6] transition-colors"
                      onClick={() => {
                        setInterestOptionIndex(idx);
                        setOpenDropdown(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Cards */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm p-4 sm:p-6 md:p-8 mb-8 md:mb-12">
          {/* Top Row - Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8">
            <ResultCard
              title="Finanzierung möglich. Neue Hypothek bis:"
              value={formatCHF(totalMortgageForCalc)}
            />
            <ResultCard
              title="Belehnung"
              value={formatPercent(belehnungRefi)}
            />
            <ResultCard
              title="Tragbarkeit"
              value={formatPercent(tragbarkeitPercent)}
            />
          </div>

          {/* Middle Row - Monthly Costs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8">
            <ResultCard
              title="Bisherige monatliche Kosten"
              value={formatCHF(monthlyOld)}
              small
            />
            <ResultCard
              title="Monatliche Gesamtkosten"
              value={formatCHF(monthlyNew)}
              small
            />
            <ResultCard
              title="Zinsen"
              value={formatCHF(monthlyInterest)}
              small
            />
          </div>

          {/* Bottom Row - Additional Costs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <ResultCard
              title="Unterhalt / Nebenkosten"
              value={formatCHF(monthlyMaintenance)}
              small
            />
          </div>

          {/* Risk Assessment */}
          <div className="mt-6 md:mt-8 bg-[#E7F8EE] border border-[#7EE8C1] rounded-[8px] p-4 sm:p-5">
            <div className="flex gap-3 items-start">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#7EE8C1] flex-shrink-0 mt-0.5">
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                  <path
                    d="M1 5.5L5 9.5L13 1"
                    stroke="#155E4A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#155E4A] mb-1">
                  Mortgage assessment
                </p>
                <p className="text-xs sm:text-sm text-[#155E4A] leading-relaxed">
                  Your eligibility, affordability, and available equity are all within a healthy range, indicating a low financial risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ResultCardProps {
  title: string;
  value: string;
  small?: boolean;
}

function ResultCard({ title, value, small = false }: ResultCardProps) {
  return (
    <div className="flex flex-col gap-2 p-4 sm:p-5 border border-[#E5E7EB] rounded-[8px] bg-[#FAFAFA] hover:bg-white transition-colors">
      <p className={`${small ? "text-xs sm:text-sm" : "text-sm sm:text-base"} font-medium text-[#666]`}>
        {title}
      </p>
      <p className={`${small ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"} font-bold text-[#222] leading-tight`}>
        {value}
      </p>
    </div>
  );
}

interface SliderInputProps {
  label: string;
  value: number;
  setValue: (val: number) => void;
  min: number;
  max: number;
  minRequired?: number;
}

function SliderInput({ label, value, setValue, min, max, minRequired }: SliderInputProps) {
  const sliderMin = 0;
  const percentage = max > sliderMin ? ((value - sliderMin) / (max - sliderMin)) * 100 : 0;
  const [inputValue, setInputValue] = useState(value.toLocaleString("de-CH"));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toLocaleString("de-CH"));
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const raw = newValue.replace(/[^0-9]/g, "");
    const parsed = Number(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      const bounded = Math.max(0, Math.min(parsed, max));
      setValue(bounded);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const raw = inputValue.replace(/[^0-9]/g, "");
    const parsed = Number(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      const bounded = Math.max(0, Math.min(parsed, max));
      setValue(bounded);
      setInputValue(bounded.toLocaleString("de-CH"));
    } else {
      setInputValue(value.toLocaleString("de-CH"));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm sm:text-base font-semibold text-[#222]">{label}</label>

      <div className="flex items-center justify-between border border-[#D1D5DB] rounded-full px-3 sm:px-4 py-2 bg-white focus-within:ring-2 focus-within:ring-[#222]">
        <input
          type="text"
          value={inputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="bg-transparent text-base sm:text-lg font-medium flex-grow outline-none"
        />
        <span className="text-base sm:text-lg font-semibold text-[#222] ml-2 flex-shrink-0">CHF</span>
      </div>

      <input
        type="range"
        min={sliderMin}
        max={max}
        value={value}
        onChange={(e) => {
          let newVal = Number(e.target.value);
          if (label && label.toLowerCase().includes("kaufpreis")) {
            newVal = Math.round(newVal / 5000) * 5000;
          }
          setValue(newVal);
        }}
        className="w-full h-1 rounded-full appearance-none cursor-pointer transition-all duration-300"
        style={{
          background: `linear-gradient(to right, #222 0%, #222 ${Math.max(
            percentage,
            2
          )}%, #E5E7EB ${Math.max(percentage, 2)}%, #E5E7EB 100%)`,
        }}
      />

      {minRequired !== undefined && (
        <p className="text-xs text-[#666] text-right mt-1">
          Minimum: {Math.round(minRequired).toLocaleString("de-CH")} CHF
        </p>
      )}
    </div>
  );
}