import { doc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

// Define a type for the document data
type DocData = Record<string, any>;

/**
 * Generates a human-readable diff string between two objects.
 */
function generateDiff(newData: DocData, oldData: DocData): string {
    const changes: string[] = [];
    for (const key in newData) {
        if (newData[key] !== oldData[key] && key !== 'updatedAt' && key !== 'updatedBy') {
            changes.push(`${key}: ${oldData[key]} → ${newData[key]}`);
        }
    }
    return changes.length > 0 ? changes.join(', ') : 'No changes';
}

/**
 * Updates a document in a subcollection (e.g., budgetLines under an event) and writes to an auditLog collection.
 */
export async function updateDocById(
    orgId: string,
    eventId: string,
    collectionName: string, // e.g. 'budgetLines'
    docId: string,
    newData: DocData,
    userProfile: User,
    oldData: DocData
): Promise<void> {
    const docRef = doc(db, 'organisations', orgId, 'events', eventId, collectionName, docId);

    const updatePayload = {
        ...newData,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile.uid,
    };

    // Update the document
    await updateDoc(docRef, updatePayload);

    // Write audit log
    const auditCollectionRef = collection(db, 'organisations', orgId, 'auditLog');
    const diffString = generateDiff(newData, oldData);

    await addDoc(auditCollectionRef, {
        action: 'UPDATED',
        collection: collectionName,
        docId: docId,
        user: userProfile.displayName || userProfile.email || 'Unknown User',
        userUid: userProfile.uid,
        diff: diffString,
        timestamp: serverTimestamp(),
    });
}

/**
 * Deletes a document from a subcollection and writes to an auditLog collection.
 */
export async function deleteDocById(
    orgId: string,
    eventId: string,
    collectionName: string,
    docId: string,
    userProfile: User,
    oldData: DocData
): Promise<void> {
    const docRef = doc(db, 'organisations', orgId, 'events', eventId, collectionName, docId);

    // Delete the document
    await deleteDoc(docRef);

    // Write audit log
    const auditCollectionRef = collection(db, 'organisations', orgId, 'auditLog');

    // For deletions, we log what was deleted
    const deletedSummary = `Deleted document. Previous actual: ${oldData.actual || 0}, budgeted: ${oldData.budgeted || 0}`;

    await addDoc(auditCollectionRef, {
        action: 'DELETED',
        collection: collectionName,
        docId: docId,
        user: userProfile.displayName || userProfile.email || 'Unknown User',
        userUid: userProfile.uid,
        diff: deletedSummary,
        timestamp: serverTimestamp(),
    });
}
