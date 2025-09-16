"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import RecipientSearch from "./components/RecipientSearch";
import LetterEditor from "./components/LetterEditor";
import type { User } from "@/types/user";

export default function WritePage() {
  const router = useRouter();
  const [step, setStep] = useState<"search" | "editor">("search");
  const [recipient, setRecipient] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);

  const handleLetterComplete = (success: boolean, message?: string) => {
    if (success) {
      setSuccessMessage(message || "Letter sent successfully!");
      setRecipient(null);
      setStep("search");
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  const handleBackToSearch = () => {
    setRecipient(null);
    setStep("search");
    setSuccessMessage('');
  };

  const handleSelectRecipient = (user: User) => {
    setRecipient(user);
    setSuccessMessage(''); // Clear any previous success message
    setStep("editor");
  };

  return (
    <div className="min-h-screen">
      {step === "search" && (
        <RecipientSearch
          onSelect={handleSelectRecipient}
          onBack={handleBackToHome}
          successMessage={successMessage || undefined}
        />
      )}
      {step === "editor" && recipient && (
        <LetterEditor
          recipient={recipient}
          onComplete={handleLetterComplete}
          onBack={handleBackToSearch}
        />
      )}
    </div>
  );
}