export type Language = {
  code: string;
  name: string;
  nativeName: string;
};

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ks", name: "Kashmiri", nativeName: "कश्मीरी" },
  { code: "sd", name: "Sindhi", nativeName: "सिन्धी" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "bh", name: "Bhojpuri", nativeName: "भोजपुरी" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली" },
  { code: "raj", name: "Rajasthani", nativeName: "राजस्थानी" },
  { code: "mni", name: "Manipuri", nativeName: "মণিপুরি" },
  { code: "gom", name: "Konkani", nativeName: "कोंकणी" },
  { code: "chh", name: "Chhattisgarhi", nativeName: "छत्तीसगढ़ी" },
  { code: "dog", name: "Dogri", nativeName: "डोगरी" },
  { code: "ka", name: "Kashmiri", nativeName: "कश्मीरी" },
];