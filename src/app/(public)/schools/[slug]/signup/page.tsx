import { notFound } from 'next/navigation';
import { getSchoolBySlug } from '@/lib/schools/getSchool';
import SignupPage from '@/components/schools/SignupPage';

export default async function SignupRoute(
  { params, searchParams }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ instrument?: string }>;
  },
) {
  const { slug } = await params;
  const { instrument } = await searchParams;
  const result = await getSchoolBySlug(slug);
  if (!result) notFound();

  return <SignupPage school={result.school} slug={slug} instrument={instrument || ''} />;
}
