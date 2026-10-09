import type { UpdateCheck, WhatsNew } from '../types/models';

/** This community build must never install an upstream-only update over its translations. */
export const COMMUNITY_VERSION = '0.6.4-zh.1';
export const COMMUNITY_RELEASES = 'https://github.com/sedirk/athenaeum/releases';
export const communityReleaseUrl = (version: string) => `${COMMUNITY_RELEASES}/tag/v${encodeURIComponent(version)}`;

function versionParts(tag: string): number[] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)-zh\.(\d+)$/.exec(tag);
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}

function compare(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

/** GitHub labels bilingual trial builds as prereleases; only the explicit -zh.N channel qualifies. */
export function selectCommunityUpdate(releases: unknown, currentVersion = COMMUNITY_VERSION): UpdateCheck {
  if (!Array.isArray(releases)) throw new Error('Invalid community release response');
  const current = versionParts(currentVersion);
  if (!current) throw new Error('Invalid community build version');
  let latest = current;
  let latestVersion = currentVersion;
  let notes: string | null = null;
  let pubDate: string | null = null;
  for (const value of releases) {
    if (!value || typeof value !== 'object') continue;
    const r = value as Record<string, unknown>;
    if (r.draft !== false || typeof r.tag_name !== 'string') continue;
    const parts = versionParts(r.tag_name);
    if (!parts || compare(parts, latest) <= 0) continue;
    // Do not advertise a source-only release as an installable Windows build.
    if (!Array.isArray(r.assets) || !r.assets.some(a => a && typeof a.name === 'string' && /_x64-setup\.exe$/.test(a.name) && a.state === 'uploaded')) continue;
    latest = parts;
    latestVersion = r.tag_name.replace(/^v/, '');
    notes = typeof r.body === 'string' ? r.body : null;
    pubDate = typeof r.published_at === 'string' ? r.published_at : null;
  }
  return {
    currentVersion, latestVersion, isUpdateAvailable: compare(latest, current) > 0,
    channel: 'stable', notes, pubDate,
    // These installers are manual downloads, not upstream-signed updater packages.
    platformSupported: false,
    downloadPageUrl: communityReleaseUrl(latestVersion),
    blogUrl: communityReleaseUrl(latestVersion), dockerImage: null,
  };
}

export async function checkCommunityUpdates(): Promise<UpdateCheck> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://api.github.com/repos/sedirk/athenaeum/releases?per_page=100', {
      signal: controller.signal, headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(`GitHub release check failed (HTTP ${response.status})`);
    return selectCommunityUpdate(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

export function communityNotes(notes: WhatsNew): WhatsNew {
  return { ...notes, version: COMMUNITY_VERSION, blogUrl: communityReleaseUrl(COMMUNITY_VERSION) };
}
