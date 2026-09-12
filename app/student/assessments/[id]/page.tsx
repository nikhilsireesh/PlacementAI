import { TakeAssessment } from "./TakeAssessment";

export default async function AssessmentTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TakeAssessment assessmentId={id} />;
}
