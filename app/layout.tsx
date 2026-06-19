import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/components/Navbar";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduTech AI",
  description: "Real-time AI Teaching Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} antialiased`}>
        <ClerkProvider appearance={{ variables: { colorPrimary: '#fe5933' }} }>
          <div className="relative min-h-screen overflow-x-hidden">
            {/* Ambient Background Glow Blobs */}
            <div className="glow-blob bg-primary/20 w-[450px] h-[450px] -top-32 -left-32 animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="glow-blob bg-blue-400/20 w-[500px] h-[500px] top-[40%] -right-40 animate-pulse" style={{ animationDuration: '12s' }} />
            <div className="glow-blob bg-amber-400/15 w-[350px] h-[350px] bottom-10 left-[30%] animate-pulse" style={{ animationDuration: '10s' }} />
            
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <div className="flex-1 pb-16">
                {children}
              </div>
            </div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}