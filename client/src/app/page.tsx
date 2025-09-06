"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { VelocityText } from "../components/VelocityText";
import Example from "../components/BubbleText";
import ExampleWrapper from "../components/SpringModal";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="text-center mt-20">
      <h1 className="text-4xl font-bold">Welcome back, {user.displayName || 'ERROR: Name Not Found'}</h1>
      <p className="mt-4 text-gray-600">You are logged in 🎉</p>
      <VelocityText/>
      <Example/>
      <ExampleWrapper/>
    </div>
  );
}
