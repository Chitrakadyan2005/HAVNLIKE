import API_URL from "./api";

export async function checkModeration(text, token) {
  try {
    const res = await fetch(`${API_URL}/api/v1/moderate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Moderation check failed:", err);
    return { allowed: true };
  }
}