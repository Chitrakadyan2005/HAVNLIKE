import { auth } from "../firebase";

export async function getFreshToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken(true); // 🔥 force refresh
}
