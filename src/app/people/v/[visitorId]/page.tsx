import { PublicPersonView } from "@/components/PublicPersonView";

type PageProps = {
  params: Promise<{ visitorId: string }>;
};

export default async function PublicVisitorPage({ params }: PageProps) {
  const { visitorId } = await params;
  return (
    <div className="px-4 py-10">
      <PublicPersonView visitorId={visitorId} />
    </div>
  );
}
