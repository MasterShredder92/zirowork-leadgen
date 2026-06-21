import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSchool } from '@/lib/schools/getSchool';
import LandingLayout from '@/components/schools/LandingLayout';
import PianoPage from '@/components/schools/PianoPage';
import GuitarPage from '@/components/schools/GuitarPage';
import VocalsPage from '@/components/schools/VocalsPage';
import DrumsPage from '@/components/schools/DrumsPage';

const INST_LABEL: Record<string, string> = { piano: 'Piano', guitar: 'Guitar', vocals: 'Voice', drums: 'Drum' };

const PAGES = {
  piano: PianoPage,
  guitar: GuitarPage,
  vocals: VocalsPage,
  drums: DrumsPage,
} as const;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; instrument: string }> },
): Promise<Metadata> {
  const { slug, instrument } = await params;
  const result = await getSchool(slug, instrument);
  if (!result) return {};
  const { school } = result;
  return {
    title: `${INST_LABEL[instrument] || instrument} Lessons in ${school.city || school.name} | ${school.name}`,
  };
}

export default async function InstrumentPage(
  { params }: { params: Promise<{ slug: string; instrument: string }> },
) {
  const { slug, instrument } = await params;
  const result = await getSchool(slug, instrument);
  if (!result) notFound();

  const Page = PAGES[instrument as keyof typeof PAGES];
  if (!Page) notFound();

  const { school, intakeUrl } = result;

  return (
    <LandingLayout school={school} intakeUrl={intakeUrl} instrument={instrument}>
      <Page school={school} intakeUrl={intakeUrl} />
    </LandingLayout>
  );
}
