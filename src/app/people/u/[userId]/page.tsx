import { PublicPersonView } from "@/components/PublicPersonView";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function PublicUserPage({ params }: PageProps) {
  const { userId } = await params;
  return (
    <div className="px-4 py-10">
      <PublicPersonView userId={userId} />
    </div>
  );
}
