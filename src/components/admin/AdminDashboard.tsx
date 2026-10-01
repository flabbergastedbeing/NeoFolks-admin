import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AdminEventsPanel } from "@/components/admin/AdminEventsPanel";
import { AdminRegistrationsPanel } from "@/components/admin/AdminRegistrationsPanel";
import { backend } from "@/lib/backend";

export function AdminDashboard({ email }: { email: string }) {
  const [tab, setTab] = useState("events");
  const [registrationsEventId, setRegistrationsEventId] = useState<string | null>(null);

  return (
    <div className="container-page flex flex-col gap-32 py-32 md:py-48">
      <header className="flex flex-wrap items-center justify-between gap-16">
        <div>
          <p className="text-caption uppercase tracking-wider text-steel-gray">NeoFolks admin</p>
          <h1 className="mt-4 font-alpha-lyrae text-heading-sm font-normal text-ghost-white md:text-heading">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-12">
          <span className="text-body-sm text-ash-gray">{email}</span>
          <Button asChild variant="outlined" size="sm">
            <Link to="/events">View site</Link>
          </Button>
          <Button variant="outlined" size="sm" onClick={() => void backend.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <AdminEventsPanel
            onViewRegistrations={(id) => {
              setRegistrationsEventId(id);
              setTab("registrations");
            }}
          />
        </TabsContent>

        <TabsContent value="registrations">
          <AdminRegistrationsPanel
            eventId={registrationsEventId}
            onSelectEvent={setRegistrationsEventId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
