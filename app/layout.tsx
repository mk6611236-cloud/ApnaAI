import "./globals.css";
import type { Metadata } from "next";

// यह हिस्सा Google Search और Social Media के लिए है
export const metadata: Metadata = {
  title: "ApnaAI - भारत का अपना AI सहायक",
  description: "Startup, Coding, Study और Marketing के लिए भारत का स्मार्ट AI जो हिंदी और हिंग्लिश में नेचुरल जवाब देता है।",
  keywords: ["ApnaAI", "Bharat AI", "Hindi AI", "AI Assistant India", "Hindustan AI"],
  authors: [{ name: "Manish Kumar" }],
  
  // जब आप WhatsApp पर लिंक भेजेंगे तो ये दिखेगा
  openGraph: {
    title: "ApnaAI - भारत का अपना AI सहायक",
    description: "Startup, Coding, Padhai aur Business ke liye smart AI assistant.",
    url: "https://apnaai-9654a.web.app",
    siteName: "ApnaAI",
    locale: "hi_IN",
    type: "website",
  },

  // Google Search Console के लिए नया कोड यहाँ अपडेट कर दिया गया है
  verification: {
    google: "cji25WHyVVAdiQYZ-9lqlh8wkE4KidrnE-nnScX9pnw", 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <body className="bg-neutral-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}