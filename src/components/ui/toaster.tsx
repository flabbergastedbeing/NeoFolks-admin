import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "!bg-carbon-card !border !border-graphite !text-ghost-white !rounded-card",
          title: "!text-ghost-white",
          description: "!text-ash-gray",
          success: "!border-mint-signal/40",
          error: "!border-error-red/40",
        },
      }}
    />
  );
}
