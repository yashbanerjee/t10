import { getPublicSettings } from "@/lib/data";
import { success } from "@/lib/api";
import { readHomepageBanner } from "@/lib/site-settings";
import { LEGAL_SETTING_KEYS, readLegalPage } from "@/lib/legal-pages";

export async function GET() {
  const settings = await getPublicSettings();
  return success({
    siteUrl: typeof settings.siteUrl === "string" ? settings.siteUrl : null,
    homepage: readHomepageBanner(settings.homepage),
    legal: { privacy: readLegalPage("privacy", settings[LEGAL_SETTING_KEYS.privacy]), terms: readLegalPage("terms", settings[LEGAL_SETTING_KEYS.terms]) },
  });
}
