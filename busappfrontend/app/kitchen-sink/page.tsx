"use client";

import { NavBar } from "@/components/NavBar";
import { Headline } from "@/components/Headline";
import { LocationField } from "@/components/LocationField";
import { TimeRow } from "@/components/TimeRow";
import { Select } from "@/components/Select";
import { Checkbox } from "@/components/Checkbox";
import { ListRow } from "@/components/ListRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Chip } from "@/components/Chip";
import { IconToggle } from "@/components/IconToggle";
import { Divider } from "@/components/Divider";
import { Badge } from "@/components/Badge";
import { CloudIcon, MapIcon, BusIcon, WalkIcon } from "@/components/icons/filled";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-label text-blue">{title}</h2>
      <div className="flex flex-col gap-3 rounded border border-dashed border-border-soft p-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-footnote text-blue opacity-footnote">{label}</span>
      {children}
    </div>
  );
}

export default function KitchenSinkPage() {
  return (
    <main className="mx-auto flex max-w-content flex-col gap-10 py-10">
      <Section title="Nav bar">
        <NavBar backLabel="Plan" />
      </Section>

      <Section title="Headline">
        <Headline subhead="Morewood Avenue">A quieter trip.</Headline>
      </Section>

      <Section title="Location field">
        <LocationField value="Morewood Avenue" />
      </Section>

      <Section title="Time row">
        <TimeRow left="Leave now" right="By 9:00" />
      </Section>

      <Section title="Select">
        <Row label="Primary — sentence case">
          <Select value="Today" options={["Today", "Tomorrow"]} onChange={() => {}} variant="primary" label="Day" />
        </Row>
        <Row label="Secondary — uppercase, .08em tracking">
          <Select
            value="Next 7 days"
            options={["Next 7 days", "Next 30 days"]}
            onChange={() => {}}
            variant="secondary"
            label="Range"
          />
        </Row>
      </Section>

      <Section title="Checkbox">
        <div className="flex items-center gap-6">
          <Row label="Default">
            <Checkbox checked={false} />
          </Row>
          <Row label="Selected">
            <Checkbox checked />
          </Row>
        </div>
      </Section>

      <Section title="List row">
        <Row label="Default">
          <ListRow title="8:30 – 10:00 am" subtitle="Lowest crowding" checked={false} />
        </Row>
        <Divider />
        <Row label="Selected">
          <ListRow title="8:30 – 10:00 am" subtitle="Lowest crowding" checked />
        </Row>
      </Section>

      <Section title="Primary button">
        <Row label="Label only">
          <PrimaryButton label="Use selected time" />
        </Row>
        <Row label="With icon + value">
          <PrimaryButton label="Walk to stop" icon={<WalkIcon className="h-4 w-4" />} value="2 min" />
        </Row>
      </Section>

      <Section title="Chip">
        <Chip icon={<CloudIcon className="h-4 w-4" />} label="Ends in 18m" />
      </Section>

      <Section title="Icon toggle">
        <div className="flex items-center gap-4">
          <Row label="Default">
            <IconToggle icon={<MapIcon className="h-4 w-4" />} label="Map view" />
          </Row>
          <Row label="Active">
            <IconToggle icon={<BusIcon className="h-4 w-4" />} active label="Bus view" />
          </Row>
        </div>
      </Section>

      <Section title="Divider">
        <Divider />
      </Section>

      <Section title="Badge">
        <div className="flex items-center gap-2">
          <Badge label="71" />
          <Badge label="61" />
          <Badge label="54" />
        </div>
      </Section>
    </main>
  );
}
