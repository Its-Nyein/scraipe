import { ComponentExample } from "@/components/component-example";
import Navbar from "@/components/web/Navbar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div>
      <Navbar />
      <ComponentExample />
    </div>
  );
}