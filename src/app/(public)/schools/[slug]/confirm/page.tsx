import { notFound } from 'next/navigation';
import { getSchoolBySlug } from '@/lib/schools/getSchool';
import ConfirmPage from '@/components/schools/ConfirmPage';

export default async function ConfirmRoute(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const result = await getSchoolBySlug(slug);
  if (!result) notFound();

  return <ConfirmPage school={result.school} slug={slug} />;
}
