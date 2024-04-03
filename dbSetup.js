import mongodb from 'mongodb'


async function connectToMongo() {
    try {
        const client = new mongodb.MongoClient('mongodb://localhost:27017', {})
        await client.connect()
        console.log('Connected to MongoDB')
        return client // return mongoDb client
    } catch (err) {
        console.error(err)
    }
}



const mainDB = 'aeonaxy-nodejs'
const passwordsDb = 'aeonaxy-nodejs-pass'
const contentDb = 'aeonaxy-nodejs-content'

const mongoClient = await connectToMongo()

export { mongoClient, mainDB, passwordsDb, contentDb }
export default mongoClient

