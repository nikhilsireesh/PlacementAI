import { TakePractice } from "./TakePractice";

export default async function PracticeTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TakePractice practiceId={id} />;
}
