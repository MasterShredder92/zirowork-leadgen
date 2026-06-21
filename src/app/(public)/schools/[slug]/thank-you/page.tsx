import { notFound } from 'next/navigation';
import { getSchoolBySlug } from '@/lib/schools/getSchool';
import ThankYouPage from '@/components/schools/ThankYouPage';

export default async function ThankYouRoute(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const result = await getSchoolBySlug(slug);
  if (!result) notFound();

  return <ThankYouPage school={result.school} slug={slug} />;
}
