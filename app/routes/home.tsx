import { useEffect, useState } from "react";
import { useSession } from "@agent-native/core/client/use-session";

import LaunchWebsite from "@/components/launch-website";

export function meta() {
  return [
    { title: "Launch — Launch day, on one runway" },
    {
      name: "description",
      content:
        "Launch puts your whole launch day on one runway: one board where you and an AI agent draft, lock, adapt, and publish every post — and nothing goes live without your approval.",
    },
  ];
}

/**
 * The public website. Anyone can read it, signed in or not; signing in is
 * what leads into the app — after login the framework lands the user on
 * their dashboard (homePath), never back here. The website adapts its
 * calls to action for a signed-in visitor ("Open the app"), and its live
 * sandbox only runs for signed-in visitors (it works on their launches).
 *
 * The document is server-rendered under an anonymous context, so the
 * signed-in variant must only appear after mount — branching on the
 * session during the first render breaks hydration.
 */
export default function HomeRoute() {
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <LaunchWebsite signedIn={mounted && status === "authenticated"} />;
}
