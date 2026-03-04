import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'

const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'scripts', 'serviceAccountKey.json'), 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

async function checkEvents() {
    const snap = await db.collectionGroup('events').get()
    console.log(`Found ${snap.size} events`)
    snap.docs.forEach(doc => {
        const data = doc.data()
        console.log(`Event ${doc.id}:`)
        console.log(` - name: ${data.name}`)
        console.log(` - date type: ${typeof data.date}`)
        console.log(` - date constructor: ${data.date?.constructor?.name}`)
        console.log(` - date value:`, data.date)
    })
    process.exit(0)
}
checkEvents()
