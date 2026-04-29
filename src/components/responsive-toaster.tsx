import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "sonner";

export function ResponsiveToaster() {
  const isMobile = useIsMobile();
  return (
    <Toaster
      closeButton
      position={isMobile ? "top-center" : "bottom-right"}
    />
  );
}
