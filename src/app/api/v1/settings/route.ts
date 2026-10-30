import { getPublicSettings } from "@/lib/data";
import { success } from "@/lib/api";
import { readHomepageBanner } from "@/lib/site-settings";
import { LEGAL_SETTING_KEYS, readLegalPage } from "@/lib/legal-pages";
import { readBrochureUrl } from "@/lib/partner-brochure";
import { getPaymentMethods } from "@/lib/payments";
import { publicThemeSong } from "@/lib/theme-song";

export async function GET() {
  const [settings, payments] = await Promise.all([getPublicSettings(), getPaymentMethods()]);
  const brochure = readBrochureUrl(settings.partnerBrochure);
  return success({
    siteUrl: typeof settings.siteUrl === "string" ? settings.siteUrl : null,
    homepage: readHomepageBanner(settings.homepage),
    brochure: brochure || null,
    themeSong: publicThemeSong(settings.themeSong),
    payments,
    legal: { privacy: readLegalPage("privacy", settings[LEGAL_SETTING_KEYS.privacy]), terms: readLegalPage("terms", settings[LEGAL_SETTING_KEYS.terms]) },
  });
}
