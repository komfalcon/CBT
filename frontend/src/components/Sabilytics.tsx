import { useEffect } from "react";

export function Sabilytics() {
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.sabilytics.com/script.js";
    script.setAttribute("data-site", "55js22qh8djh");
    script.setAttribute("data-domain", "aurikrex.tech");
    document.head.appendChild(script);
  }, []);

  return null;
}
