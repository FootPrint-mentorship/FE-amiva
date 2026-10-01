export const WA_BOT_NUMBER =
  process.env.NEXT_PUBLIC_WA_BOT_NUMBER ?? "2349058155331";

export const SUPPORT_EMAIL = "support@tryamiva.com";

/**
 * WhatsApp deep link with a pre-filled greeting. The bracketed tag at the
 * end is the acquisition SOURCE: the backend records it on first contact
 * (audit event `acquisition.first_contact`) so WhatsApp-first sign-ups can be
 * attributed per channel — something web analytics can never see. Use short
 * lowercase tags: "web" (site CTAs), "app" (inside the dashboard), and for
 * posts/ads the channel name ("ig", "x", "li", "flyer"…). The user can delete
 * the tag before sending; attribution then falls back to "direct".
 */
export function waLink(source = "web"): string {
  const tag = source.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20);
  return `https://wa.me/${WA_BOT_NUMBER}?text=${encodeURIComponent(
    tag ? `Hi Amiva (${tag})` : "Hi Amiva"
  )}`;
}

/** Default link for the marketing site. */
export const WA_LINK = waLink("web");
