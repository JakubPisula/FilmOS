const FRAMEIO_API_URL = "https://api.frame.io/v2"; // V4 is actually under V2 endpoints but structured differently for assets/projects

export async function createFrameioProject(name: string, clientId: string) {
  const token = process.env.FRAMEIO_API_TOKEN;
  const teamId = process.env.FRAMEIO_TEAM_ID;

  if (!token || !teamId) throw new Error("Missing Frame.io credentials");

  // Create Project in Frame.io V4
  const response = await fetch(`${FRAMEIO_API_URL}/teams/${teamId}/projects`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create Frame.io project");

  return data.id; // Project ID
}

export async function createReviewLink(assetId: string) {
  const token = process.env.FRAMEIO_API_TOKEN;
  if (!token) throw new Error("Missing Frame.io credentials");

  const response = await fetch(`${FRAMEIO_API_URL}/assets/${assetId}/review_links`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Dla Klienta",
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create Review Link");

  return data.short_url;
}
