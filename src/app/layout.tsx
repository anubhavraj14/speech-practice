import type { Metadata } from "next";
import { Geist, Noto_Sans_Devanagari } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"] });
export const metadata: Metadata = { title: { default:"SpeakFlow", template:"%s · SpeakFlow" }, description:"Calm, guided speech practice in Hindi, Hinglish and English." };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en" suppressHydrationWarning><body className={`${geist.variable} ${devanagari.variable}`}><StoreProvider>{children}</StoreProvider></body></html>; }
