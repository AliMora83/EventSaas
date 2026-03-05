import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCqXu7wDoIUDgHSwzrr-NYhDOuvezqWkn0",
  authDomain: "eventsaas-da125.firebaseapp.com",
  projectId: "eventsaas-da125"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const querySnapshot = await getDocs(collection(db, "organisations/namka-events/events"));
  console.log("Events count:", querySnapshot.size);
  process.exit(0);
}
check().catch(e => {
  console.error(e.message);
  process.exit(1);
});
