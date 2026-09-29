import { PageHeader } from "@/components/shared/page-header";
import { getWorkspaceContext } from "@/modules/organizations/context";
import { SettingsNav } from "@/modules/settings/components/settings-nav";

export default async function SettingsLayout({
  children,
  params,
}: LayoutProps<"/w/[slug]/settings">) {
  const { slug } = await params;
  const { organization } = await getWorkspaceContext(slug);

  return (
    <div className="grid gap-6">
      <PageHeader title="Settings" description={`Manage your account and ${organization.name}.`} />
      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <SettingsNav slug={organization.slug} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
