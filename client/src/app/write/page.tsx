"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import RecipientSearch from "./components/RecipientSearch";
import LetterEditor from "./components/LetterEditor";
import ScheduleSend from "./components/ScheduleSend";
import Confirmation from "./components/Confirmation";
import type { User } from "@/types/user";
import type { Letter } from "@/types/letter";

export default function WritePage() {
  const router = useRouter();
  const [step, setStep] = useState<"search" | "editor" | "schedule" | "done">("search");
  const [recipient, setRecipient] = useState<User | null>(null);
  const [letter, setLetter] = useState<Letter | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <button
        onClick={() => router.push("/")}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Go Back to Homepage
      </button>
      {step === "search" && (
        <RecipientSearch
          onSelect={(user) => {
            setRecipient(user);
            setStep("editor");
          }}
        />
      )}
      {step === "editor" && recipient && (
        <LetterEditor
          recipient={recipient}
          onDraft={(draft) => {
            setLetter(draft);
            setStep("schedule");
          }}
        />
      )}
      {step === "schedule" && letter && (
        <ScheduleSend
          letter={letter}
          onFinish={() => setStep("done")}
        />
      )}
      {step === "done" && <Confirmation />}
    </div>
  );
}
