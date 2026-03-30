import { getDriveClient } from "@/lib/google-auth";
import { prisma } from "@/lib/prisma";

export async function createClientFolder(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) throw new Error("Client not found");
  if (client.driveFolderId) return client.driveFolderId;

  const drive = await getDriveClient();
  const parentId = process.env.GOOGLE_DRIVE_PARENT_ID;

  const folderName = `Pliki Klienta - ${client.name}`;
  
  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentId ? [parentId] : [],
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });

  const folderId = response.data.id;

  if (folderId) {
    // Update client with folderId
    await prisma.client.update({
      where: { id: clientId },
      data: { driveFolderId: folderId },
    });

    // Share folder with client email
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "writer",
        type: "user",
        emailAddress: client.email,
      },
    });

    return folderId;
  }

  throw new Error("Failed to create folder");
}
