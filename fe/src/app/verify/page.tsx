import { Suspense } from "react";
import type { Metadata } from "next";
import VerifyForm from "./VerifyForm";

export const metadata: Metadata = { title: "Verify email" };
export default function VerifyPage() {
  return <Suspense><VerifyForm /></Suspense>;
}
