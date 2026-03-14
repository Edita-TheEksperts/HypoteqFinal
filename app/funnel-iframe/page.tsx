
import { Suspense } from "react";
import FunnelIframeClient from "./FunnelIframeClient";

export default function FunnelIframePage() {
  return (
    <Suspense>
      <FunnelIframeClient />
    </Suspense>
  );
}