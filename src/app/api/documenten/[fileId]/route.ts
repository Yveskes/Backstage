import { canAccessDocuments } from "@/lib/documents-access";
import { downloadDriveFile, getDriveFile, isAllowedDriveFile } from "@/lib/google-drive";

type DocumentFileRouteProps = {
  params: Promise<{ fileId: string }>;
};

export async function GET(request: Request, context: DocumentFileRouteProps) {
  if (!(await canAccessDocuments())) {
    return new Response("Geen toegang", { status: 401 });
  }

  const { fileId } = await context.params;
  if (!fileId || !(await isAllowedDriveFile(fileId))) {
    return new Response("Bestand niet gevonden", { status: 404 });
  }

  const meta = await getDriveFile(fileId);
  if (!meta || meta.isFolder) {
    return new Response("Bestand niet gevonden", { status: 404 });
  }

  try {
    const downloaded = await downloadDriveFile(fileId);
    const asDownload = new URL(request.url).searchParams.get("download") === "1";
    const disposition = asDownload ? "attachment" : "inline";

    const filename = downloaded.file.name.replace(/[\r\n"]/g, "");
    const encoded = encodeURIComponent(downloaded.file.name);

    return new Response(downloaded.body, {
      headers: {
        "Content-Type": downloaded.mime,
        "Content-Disposition": `${disposition}; filename="${filename}"; filename*=UTF-8''${encoded}`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new Response("Downloaden is mislukt", { status: 502 });
  }
}
