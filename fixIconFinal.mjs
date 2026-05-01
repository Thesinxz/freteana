import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env.local") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixIcons() {
  const querySnapshot = await getDocs(collection(db, "transportadoras"));
  for (const document of querySnapshot.docs) {
    const data = document.data();
    let newIcon = data.icon;

    // Fix capitalization
    if (newIcon === 'truck') newIcon = 'Truck';
    if (newIcon === 'star') newIcon = 'Star';
    if (newIcon === 'sun') newIcon = 'Sun';
    if (newIcon === 'zap') newIcon = 'Zap';

    // Force Star for Estrella Del Norte
    if (data.name.includes("Estrella")) {
      newIcon = 'Star';
    }

    if (newIcon !== data.icon) {
      console.log(`Updating ${data.name}: ${data.icon} -> ${newIcon}`);
      await updateDoc(doc(db, "transportadoras", document.id), { icon: newIcon });
    }
  }
  console.log("Done!");
  process.exit(0);
}

fixIcons();
