"use client";

import { useState } from "react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface FormStatus {
  type: "success" | "error" | null;
  message: string;
}

export default function FunnelContactForm() {
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const [status, setStatus] = useState<FormStatus>({
    type: null,
    message: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/funnel-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setStatus({
          type: "success",
          message: "Vielen Dank! Wir werden Sie bald kontaktieren."
        });
        setForm({ firstName: "", lastName: "", email: "", phone: "" });
      } else {
        setStatus({
          type: "error",
          message: "Fehler beim Absenden. Bitte versuchen Sie es später erneut."
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Netzwerkfehler. Bitte versuchen Sie es später erneut."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white py-8 sm:py-12 md:py-16">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header Section */}
        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white  rounded-[12px] p-6 sm:p-8 md:p-10 shadow-sm"
        >
          {/* Heading with divider */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-[#222] mb-4">
              Basisch Informationen
            </h3>
            <div className="h-[1px] bg-[#E5E7EB]" />
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
            {/* First Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="firstName" className="text-sm sm:text-base font-semibold text-[#222]">
                Vorname
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Geben Sie Ihren Vornamen ein"
                value={form.firstName}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-[#D1D5DB] rounded-[8px] bg-white text-[#222] placeholder-[#999] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1A2A36] focus:border-transparent disabled:bg-[#F9FAFB] disabled:text-[#999] disabled:cursor-not-allowed"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="lastName" className="text-sm sm:text-base font-semibold text-[#222]">
                Nachname
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Geben Sie Ihren Nachnamen ein"
                value={form.lastName}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-[#D1D5DB] rounded-[8px] bg-white text-[#222] placeholder-[#999] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1A2A36] focus:border-transparent disabled:bg-[#F9FAFB] disabled:text-[#999] disabled:cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm sm:text-base font-semibold text-[#222]">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Geben Sie Ihre E-Mail ein"
                value={form.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-[#D1D5DB] rounded-[8px] bg-white text-[#222] placeholder-[#999] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1A2A36] focus:border-transparent disabled:bg-[#F9FAFB] disabled:text-[#999] disabled:cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm sm:text-base font-semibold text-[#222]">
                Telefonnummer
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Geben Sie Ihre Telefonnummer ein"
                value={form.phone}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-[#D1D5DB] rounded-[8px] bg-white text-[#222] placeholder-[#999] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1A2A36] focus:border-transparent disabled:bg-[#F9FAFB] disabled:text-[#999] disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Status Messages */}
          {status.type && (
            <div
              className={`mb-6 sm:mb-8 p-4 sm:p-5 rounded-[8px] border ${
                status.type === "success"
                  ? "bg-[#E7F8EE] border-[#7EE8C1] text-[#155E4A]"
                  : "bg-[#FEE7E7] border-[#F08080] text-[#8B2C2C]"
              }`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                {status.type === "success" ? (
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <p className="text-sm sm:text-base font-medium">{status.message}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-[#1A2A36] text-white font-semibold text-sm sm:text-base rounded-[8px] hover:bg-[#223344] active:bg-[#0F1823] transition-all duration-150 disabled:bg-[#999] disabled:cursor-not-allowed shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A2A36]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Wird gesendet...
                </span>
              ) : (
                "Anfrage senden"
              )}
            </button>
          </div>

          {/* Form Info */}
          <p className="text-xs sm:text-sm text-[#999] mt-4 sm:mt-6 text-center sm:text-left">
            Ihre Daten werden sicher übertragen und nicht an Dritte weitergegeben.
          </p>
        </form>
      </div>
    </div>
  );
}