export const WA_BOT_NUMBER =
  process.env.NEXT_PUBLIC_WA_BOT_NUMBER ?? "2349058155331";

export const SUPPORT_EMAIL = "support@tryamiva.com";

export const WA_LINK = `https://wa.me/${WA_BOT_NUMBER}?text=${encodeURIComponent(
  "Hi Amiva"
)}`;
