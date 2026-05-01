import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "fretebela",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearDB() {
  console.log("Clearing fretes...");
  const fretesSnap = await getDocs(collection(db, "fretes"));
  for (const doc of fretesSnap.docs) {
    await deleteDoc(doc.ref);
    console.log(`Deleted frete: ${doc.id}`);
  }

  console.log("Clearing pagamentos...");
  const pagamentosSnap = await getDocs(collection(db, "pagamentos"));
  for (const doc of pagamentosSnap.docs) {
    await deleteDoc(doc.ref);
    console.log(`Deleted pagamento: ${doc.id}`);
  }

  console.log("Database cleared successfully!");
  process.exit(0);
}

clearDB().catch(console.error);
