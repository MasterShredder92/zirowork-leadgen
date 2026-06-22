import { supabase } from '@/lib/supabase/client';

export type Testimonial = string | { text?: string; quote?: string; author?: string };
export type Photo = string | { url?: string };
export type Hours = string | { weekdays?: string; weekends?: string } | null;
export type Stat = { value: string; label: string };

export type School = {
  name: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  about: string;
  tagline: string;
  accent: string;
  testimonials: Testimonial[];
  photos: Photo[];
  offer: string;
  ageMin: number;
  teachers: unknown[];
  directorName: string;
  address: string;
  hours: Hours;
  mapUrl: string;
  logo: string | null;
  stats: Stat[];
  slug: string;
};

type ClientRow = Record<string, unknown>;
type PageRow = Record<string, unknown>;
type ConfigRow = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

const SCHOOL_ACCENT_DEFAULT = '#E04D27'; // hex-allow: TS data-layer fallback passed as string to DB/API; var() not valid in JS data context

function buildSchool(
  client: ClientRow,
  config: ConfigRow,
  page: PageRow | null,
  slug: string,
): School {
  return {
    name:
      str(client.name) ||
      (page ? str(page.school_name) : '') ||
      str(config.location_name) ||
      'Music School',
    city: str(client.city),
    state: str(client.state),
    phone: str(client.studio_phone),
    email: str(client.email),
    about: str(config.about),
    tagline: str(config.tagline) || str(client.tagline),
    accent: str(config.primary_color) || str(config.accent_color) || SCHOOL_ACCENT_DEFAULT,
    testimonials:
      (config.testimonials as Testimonial[] | undefined) ||
      (client.testimonial ? [client.testimonial as Testimonial] : []),
    photos: (config.photos as Photo[] | undefined) || [],
    offer: str(client.offer) || 'First lesson free',
    ageMin: (config.age_min as number | undefined) || 4,
    teachers: (client.teachers as unknown[] | undefined) || [],
    directorName: str(config.director_name),
    address: str(config.address),
    hours: (config.hours as Hours) || null,
    mapUrl: str(config.map_url),
    logo:
      str(client.logo_url) ||
      str(client.logo) ||
      str(config.logo_url) ||
      str(config.logo) ||
      null,
    stats:
      (config.stats as Stat[] | undefined) ||
      (client.stats as Stat[] | undefined) ||
      [],
    slug,
  };
}

export async function getSchool(
  slug: string,
  instrument: string,
): Promise<{ school: School; intakeUrl: string } | null> {
  const { data: pages } = await supabase
    .from('client_pages')
    .select('*')
    .eq('slug', slug)
    .eq('instrument', instrument)
    .eq('status', 'live')
    .limit(1);

  if (!pages?.length) return null;
  const page = pages[0] as PageRow;

  const [{ data: clients }, { data: tenants }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', page.client_id).limit(1),
    supabase.from('agent_tenants').select('*').eq('tenant_id', page.client_id).limit(1),
  ]);

  const client = (clients?.[0] as ClientRow | undefined) || {};
  const config = ((tenants?.[0] as { config?: ConfigRow } | undefined)?.config) || {};
  const school = buildSchool(client, config, page, slug);

  const intakeUrl = `/schools/${slug}/signup?instrument=${instrument}`;
  return { school, intakeUrl };
}

export async function getSchoolBySlug(slug: string): Promise<{ school: School } | null> {
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', slug)
    .limit(1);

  if (!clients?.length) return null;
  const client = clients[0] as ClientRow;

  const { data: tenants } = await supabase
    .from('agent_tenants')
    .select('*')
    .eq('tenant_id', client.id)
    .limit(1);

  const config = ((tenants?.[0] as { config?: ConfigRow } | undefined)?.config) || {};
  const school = buildSchool(client, config, null, slug);
  return { school };
}
