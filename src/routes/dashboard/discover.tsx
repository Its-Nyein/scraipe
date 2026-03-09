import { ScrambleText } from "@/components/ui/magic/scramble-text";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/discover")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="py-7 px-4">
      <h1 className="text-3xl font-bold">
        <ScrambleText text="Discover" />
      </h1>
    </div>
  );
}
