import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { YearSwitcher } from "@/components/year-switcher";
import { parseFestivalYear } from "@/lib/festival-year";
import {
  driveFileKindLabel,
  folderIdForYear,
  getDriveConfig,
  getDriveFile,
  isAllowedDriveFile,
  listDriveFolder,
  suggestedYearFolders,
} from "@/lib/google-drive";
import { formatAssetDate, formatFileBytes } from "@/lib/media-library";

type DocumentenPageProps = {
  searchParams: Promise<{ jaar?: string | string[]; map?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DocumentenPage({ searchParams }: DocumentenPageProps) {
  const params = await searchParams;
  const year = parseFestivalYear(params.jaar);
  const mapId = firstParam(params.map);
  const config = getDriveConfig();

  if (!config) {
    return (
      <>
        <PageHeader
          title="Documenten"
          description="Bestanden uit Google Drive, per festivaljaar."
        />
        <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-6 text-sm leading-6 text-zinc-600">
          <p className="font-medium text-zinc-900">Google Drive is nog niet gekoppeld.</p>
          <p className="mt-2">
            De documenten blijven in Drive staan. Backstage toont ze hier zodra de koppeling klaar is.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            <li>Maak in Google Cloud een project en zet de Drive API aan.</li>
            <li>Maak een serviceaccount en download de JSON-sleutel.</li>
            <li>
              Zet in <code className="rounded bg-zinc-100 px-1">.env.local</code> en bij Vercel:
              <code className="ml-1 rounded bg-zinc-100 px-1">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>,
              <code className="ml-1 rounded bg-zinc-100 px-1">GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code> en
              <code className="ml-1 rounded bg-zinc-100 px-1">GOOGLE_DRIVE_FOLDER_ID</code>.
            </li>
            <li>Deel de Drive-map met dat serviceaccount-e-mailadres (lezer is genoeg).</li>
            <li>
              Zet in die map submappen <code className="rounded bg-zinc-100 px-1">{suggestedYearFolders().join(", ")}</code>.
            </li>
          </ol>
          <p className="mt-4 text-zinc-500">
            De map-ID staat in de Drive-link: drive.google.com/drive/folders/<span className="font-medium text-zinc-700">MAP_ID</span>
          </p>
        </section>
      </>
    );
  }

  let error: string | null = null;
  let folderId: string | null = null;
  let folderName = String(year);
  let items: Awaited<ReturnType<typeof listDriveFolder>> = [];

  try {
    const yearFolderId = await folderIdForYear(year);
    if (!yearFolderId) {
      error = `Geen map “${year}” gevonden in Drive. Maak een submap met die naam, of zet GOOGLE_DRIVE_FOLDER_${year}.`;
    } else if (mapId) {
      const allowed = await isAllowedDriveFile(mapId);
      const folder = allowed ? await getDriveFile(mapId) : null;
      if (!folder?.isFolder) {
        error = "Deze map bestaat niet of ligt buiten de gedeelde Drive-map.";
      } else {
        folderId = folder.id;
        folderName = folder.name;
        items = await listDriveFolder(folder.id);
      }
    } else {
      folderId = yearFolderId;
      items = await listDriveFolder(yearFolderId);
    }
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Drive kon niet worden gelezen. Deel de map met het serviceaccount.";
  }

  const folders = items.filter((item) => item.isFolder);
  const files = items.filter((item) => !item.isFolder);

  return (
    <>
      <PageHeader
        title="Documenten"
        description="Bestanden uit Google Drive. Open of download ze hier; ze blijven in Drive staan."
        actions={<YearSwitcher year={year} hrefForYear={(nextYear) => `/documenten?jaar=${nextYear}`} />}
      />

      {mapId && folderId ? (
        <p className="mb-4 text-sm text-zinc-500">
          <Link href={`/documenten?jaar=${year}`} className="hover:text-zinc-800">
            {year}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-800">{folderName}</span>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {error}
          {error.startsWith("Geen map") ? null : (
            <span className="mt-2 block text-amber-800">
              Deel de Drive-map met {config.email} als lezer.
            </span>
          )}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white px-5 py-12 text-center text-sm text-zinc-500">
          Deze map is leeg voor {year}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Naam</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Gewijzigd</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {folders.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/documenten?jaar=${year}&map=${item.id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">Map</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.modifiedAt ? formatAssetDate(item.modifiedAt) : "—"}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))}
              {files.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3">
                    <a
                      href={`/api/documenten/${item.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {item.name}
                    </a>
                    {item.size ? (
                      <span className="mt-0.5 block text-xs text-zinc-500">{formatFileBytes(item.size)}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{driveFileKindLabel(item.mimeType)}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.modifiedAt ? formatAssetDate(item.modifiedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/api/documenten/${item.id}?download=1`}
                      className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                    >
                      Downloaden
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
