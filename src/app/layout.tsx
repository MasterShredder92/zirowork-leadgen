import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = { title: "LeadGen", description: "" };

const themeBoot = `try{if(localStorage.getItem('zw-theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><script dangerouslySetInnerHTML={{ __html: themeBoot }} /></head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
