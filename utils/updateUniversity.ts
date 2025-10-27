import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

/**
 * Updates a university's status in Firestore.
 * @param id - Document ID (e.g., "uni-birmingham")
 * @param status - New status ("affiliated" or "competing")
 */
export async function updateUniversityStatus(id: string, status: string) {
  try {
    await updateDoc(doc(db, "universities", id), { 
      status,
      isCompeting: status === "competing",
      lastUpdated: new Date()
    });
    console.log(`✅ ${id} updated to ${status}`);
  } catch (err) {
    console.error("❌ Error updating university:", err);
  }
}

/**
 * Updates a university's sports in Firestore.
 * @param id - Document ID (e.g., "uni-birmingham")
 * @param sports - Array of sports the university is competing in
 */
export async function updateUniversitySports(id: string, sports: string[]) {
  try {
    await updateDoc(doc(db, "universities", id), { 
      sports,
      lastUpdated: new Date()
    });
    console.log(`✅ ${id} sports updated to:`, sports);
  } catch (err) {
    console.error("❌ Error updating university sports:", err);
  }
}
