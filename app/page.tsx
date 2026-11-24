import { Button } from "@/components/ui/button";
import { siteText } from "@/lib/site-text";

// Starter page for A0.1. The real home page (city picker, categories,
// latest listings) is built in T0.4, T0.5 and T1.9.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-[32px] leading-tight font-bold tracking-tight">
        <span className="text-saffron-dark">{siteText.brandFirst}</span>
        <span className="text-teal">{siteText.brandSecond}</span>
      </h1>
      <p className="text-lg font-semibold text-teal">{siteText.tagline}</p>
      <p className="max-w-prose text-base text-muted-foreground">
        {siteText.intro}
      </p>
      {/* Placeholder: the Post Ad flow arrives in T1.2. */}
      <Button
        type="button"
        size="lg"
        className="h-11 px-6 text-base font-semibold"
        aria-describedby="coming-soon"
      >
        {siteText.postAd}
      </Button>
      <p id="coming-soon" className="text-sm text-muted-foreground">
        {siteText.comingSoon}
      </p>
    </main>
  );
}
