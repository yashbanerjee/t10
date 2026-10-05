import { getPublicSettings } from "@/lib/data";
import { success } from "@/lib/api";
import { readHomepageBanner } from "@/lib/site-settings";

export async function GET() {
  const settings = await getPublicSettings();
  return success({
    siteUrl: typeof settings.siteUrl === "string" ? settings.siteUrl : null,
    homepage: readHomepageBanner(settings.homepage),
  });
}
