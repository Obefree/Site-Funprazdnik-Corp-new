import type { Metadata } from "next";
import "./dice.css";

export const metadata: Metadata = {
  title: "Dice Draft — Obefree",
  description: "Two-player tactical card drafting and shared-dice-pool combat prototype.",
};

export default function DiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
