import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyWorkout Trainer",
  description: "Wissenschaftlich fundierte, adaptive Workout-Planung"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
