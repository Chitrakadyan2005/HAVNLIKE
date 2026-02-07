import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyATS7QDzw_rUJQFsZtKTIJs3z0o28XCHaQ",
  authDomain: "havnlike.firebaseapp.com",
  projectId: "havnlike",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();