import { redirect } from "next/navigation";

export default async function WorkspaceIndexPage({ params }: PageProps<"/w/[slug]">) {
  const { slug } = await params;
  redirect(`/w/${slug}/dashboard`);
}
