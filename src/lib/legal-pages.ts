import { z } from "zod";

export type LegalPageKind = "privacy" | "terms";

export const LEGAL_SETTING_KEYS: Record<LegalPageKind, string> = { privacy: "legalPrivacy", terms: "legalTerms" };

export const legalPageSchema = z.object({
  title: z.string().trim().min(2).max(60),
  intro: z.string().trim().max(300).default(""),
  content: z.string().trim().min(20).max(60000),
  /** Shown as "Last updated" on the public page, as YYYY-MM-DD. */
  updatedOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type LegalPage = z.infer<typeof legalPageSchema>;

const privacyContent = `## Who we are
This website, unitedtigers.ae, is run by United Tigers, a franchise competing in the Abu Dhabi T10. In this policy, "we", "us" and "the club" mean United Tigers. If you have any question about your information, please reach us through the [contact page](/contact).

## Information we collect
We only collect the information you choose to give us through the forms on this website:
- **Contact form:** your name, email address, phone number if you add one, the subject and your message.
- **Partner brochure requests:** your name, email address and mobile number.
- **Shop orders:** your name, email address, phone number, delivery address, city and country, any notes you add, and the items you order.
- **Polls:** your name, email address, phone number and the option you vote for.
- **Contests:** your name, email address, phone number and your answer.

We do not ask for your card details on this website. Fans do not need an account to use it.

## Card payments
When online payment is available, card payments are taken by Stripe on its own secure checkout page. Your card details go straight to Stripe and are never seen or stored by the club. We receive the payment result and a payment reference so we can match it to your order. Stripe handles payment information under its own [privacy policy](https://stripe.com/privacy).

## How we use your information
- To reply to your messages and enquiries.
- To send you the partnership brochure and follow up on partnership interest.
- To process, confirm, deliver and support your shop orders, including order confirmation emails and order tracking.
- To record poll votes and contest entries, make sure each person votes or enters only once, and contact contest winners.
- To keep the website secure and working properly.

We do not sell your personal information, and we do not share it with anyone for their own marketing.

## Emails we send
When you submit a form, we email a confirmation to the address you gave us, and the club team receives a copy so they can respond. We only use your email address for the purpose you gave it to us.

## Analytics, cookies and browser storage
This website uses Google Analytics, through Firebase, to understand which pages are visited and how the site is used. Google sets analytics cookies for this measurement. Information you type into our forms is not sent to analytics.

Your shopping cart is saved in your own browser so it is still there when you come back, and the site remembers whether you have already seen the welcome animation. This information stays on your device. You can clear it at any time through your browser settings, and you can also block or delete cookies there.

## Who can see your information
Your information is only available to authorised club administrators. We also rely on trusted service providers to run this website, such as our hosting, database, file storage and email providers, Stripe for card payments and Google for analytics. They process information only to provide their service to us. We may also share information where the law requires it.

## How long we keep it
We keep your information only for as long as we need it for the purpose it was collected, for example to complete an order and keep the records we are required to keep, or to run a poll or contest. When it is no longer needed, it is deleted.

## Your choices
You can ask us for a copy of the information we hold about you, ask us to correct it, or ask us to delete it. Please send your request through the [contact page](/contact) using the same email address you used on the website, so we can find your details.

## Children
This website is for a general audience. If you are under 18, please ask a parent or guardian before you place an order or enter a contest.

## Changes to this policy
We may update this policy from time to time. The date at the top of this page shows when it last changed.`;

const termsContent = `## About these terms
These terms apply to your use of unitedtigers.ae, the official website of United Tigers. By using the website you agree to them. If you do not agree, please do not use the website.

## Information on this website
Fixtures, results, scorecards, player profiles and team news are published as they are confirmed by the club. Match dates, times and venues can change, so please check the latest information before you travel. Player statistics from other competitions are compiled from public sources and are provided for supporter information. We take care to keep everything accurate, but we cannot guarantee that every detail is complete or free of errors.

## Shop orders
- Prices are shown in UAE dirhams (AED).
- Placing an order is a request to buy. An order is accepted once the club confirms it. All products are subject to availability.
- When online payment is available, you pay by card through Stripe's secure checkout. Otherwise, the club contacts you to arrange payment and delivery.
- You can follow your order on the [track your order](/track-order) page using your order number and email address.
- If something is wrong with your order, or you want to cancel it, please contact us through the [contact page](/contact) as soon as possible with your order number. If an order is cancelled after you have paid, the refund is returned to the original payment method.

## Polls and contests
- Each person can vote once in each poll and enter each contest once, using one email address.
- Each contest shows its prize, its question and its closing date. Entries received after a contest closes are not accepted.
- Winners are contacted using the details given on their entry. If we cannot reach a winner, we may choose another entrant.
- We may remove entries or votes that use false details or try to get around these rules.

## Messages you send us
Please do not send anything unlawful, offensive or misleading, or anything that belongs to someone else, through the forms on this website.

## Names, logos and content
The United Tigers name, crest and brand, and the text, photographs and videos on this website, belong to United Tigers or to their respective owners, including the league, our partners and photographers. You may view and share pages for personal, non-commercial use. Please do not copy, change or use them commercially without permission.

## Links to other websites
This website links to other websites, such as social media, partners and Stripe checkout. We are not responsible for the content or practices of those websites.

## Our responsibility
We work to keep this website available and accurate, but it is provided as it is and may sometimes be unavailable. To the extent the law allows, the club is not responsible for any loss that results from using the website or relying on its information. Nothing in these terms limits any rights you have under the law.

## Governing law
These terms are governed by the laws of the United Arab Emirates.

## Changes to these terms
We may update these terms from time to time. The date at the top of this page shows when they last changed.

## Contact
For any question about these terms, please use the [contact page](/contact).`;

export const legalDefaults: Record<LegalPageKind, LegalPage> = {
  privacy: { title: "Privacy", intro: "How United Tigers collects, uses and protects the information you share through this website.", content: privacyContent, updatedOn: "2026-10-11" },
  terms: { title: "Terms", intro: "The terms that apply when you use this website, shop with us or take part in polls and contests.", content: termsContent, updatedOn: "2026-10-11" },
};

export function readLegalPage(kind: LegalPageKind, value: unknown): LegalPage {
  const parsed = legalPageSchema.safeParse(value);
  return parsed.success ? parsed.data : legalDefaults[kind];
}

export function formatLegalDate(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
