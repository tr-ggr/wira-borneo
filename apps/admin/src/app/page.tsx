import Link from 'next/link';

const modules = [
  {
    href: '/volunteers',
    title: 'Volunteer Approvals',
    subtitle: 'Approve or reject pending volunteer requests.',
  },
  {
    href: '/warnings/new',
    title: 'Manual Warning Dispatch',
    subtitle: 'Compose and confirm warnings with area and radius targeting.',
  },
  {
    href: '/map',
    title: 'Hazard & Pin Map View',
    subtitle: 'OpenLayers map with vulnerability overlays and pin statuses.',
  },
];

export default function HomePage() {
  return (
    <section className="page-shell">
      <header className="section-header">
        <p className="eyebrow">WIRA Admin Console</p>
        <h1 className="title">Manual Disaster Operations / Operasi Manual</h1>
        <p className="subtitle">
          Warning dispatch is manual only to prevent false alarms.
        </p>
      </header>

      <div className="grid-list">
        {modules.map((module) => (
          <Link key={module.href} href={module.href} className="card module-card">
            <h2 className="card-title">{module.title}</h2>
            <p className="muted">{module.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
