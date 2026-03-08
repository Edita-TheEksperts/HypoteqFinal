"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";


export default function FunnelContactForm() {
  // Force German translations for iframe
  const { t } = useTranslation("de");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const res = await fetch("/api/funnel-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setStatus("Thank you! We will contact you soon.");
      setForm({ firstName: "", lastName: "", email: "", phone: "" });
    } else {
      setStatus("Submission failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 w-full max-w-md bg-white p-8 rounded-2xl border shadow-card items-center"
        style={{ fontFamily: "'SF Pro Display', Inter, sans-serif" }}
      >
        <h2 className="text-3xl font-semibold mb-2 text-[#132219] text-center">{t("footer.contactUs", "Kontaktiere uns")}</h2>
        <input
          name="firstName"
          placeholder={t("contactform.firstName", "Vorname")}
          value={form.firstName}
          onChange={handleChange}
          required
          className="input-base text-[#132219] focus:ring-2 focus:ring-[#CAF476] focus:border-[#CAF476] bg-white"
        />
        <input
          name="lastName"
          placeholder={t("contactform.lastName", "Nachname")}
          value={form.lastName}
          onChange={handleChange}
          required
          className="input-base text-[#132219] focus:ring-2 focus:ring-[#CAF476] focus:border-[#CAF476] bg-white"
        />
        <input
          name="email"
          type="email"
          placeholder={t("contactform.email", "E-Mail")}
          value={form.email}
          onChange={handleChange}
          required
          className="input-base text-[#132219] focus:ring-2 focus:ring-[#CAF476] focus:border-[#CAF476] bg-white"
        />
        <input
          name="phone"
          placeholder={t("contactform.phone", "Telefonnummer")}
          value={form.phone}
          onChange={handleChange}
          required
          className="input-base text-[#132219] focus:ring-2 focus:ring-[#CAF476] focus:border-[#CAF476] bg-white"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-[#CAF476] text-[#132219] px-4 py-3 text-lg font-semibold shadow hover:opacity-90 transition"
        >
          {t("contactform.submit", "Absenden")}
        </button>
        {status && (
          <div className="mt-2 text-center text-[#3B7A2A] font-medium">{status}</div>
        )}
      </form>
    </div>
  );
}
