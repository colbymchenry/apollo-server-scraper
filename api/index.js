import { ApolloServer, gql } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from 'helmet';
import {config} from "dotenv";
import admin from 'firebase-admin';


config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
const httpServer = http.createServer(app);

const typeDefs = gql`
  type Query {
    scrapers: [Scraper!]
    scraper(id: ID!): Scraper
  }

  type Scraper {
    id: ID!
    name: String!
    nextPageSelector: String
    singleItemSelector: String
    startUrl: String
    url: String
    rows: [ScraperSelector!]
  }

  type ScraperSelector {
    label: String!
    selector: String
    keySelector: String
    valueSelector: String
    isImage: Boolean
  }

  type Settings {
    id: ID!
    bigcommerce: BigCommerceSettings
    chatgpt: ChatGPTSettings
  }

  type BigCommerceSettings {
    id: ID!
    apiToken: String
    clientId: String
    clientSecret: String
    storeHash: String
  }

  type ChatGPTSettings {
    secretKey: String
  }

`;

const resolvers = {
  Query: {
    scrapers: async () => await FirebaseAdmin.getCollectionArray("scrapers"),
    scraper: async (_, args, data, _) => {
      console.log("aRGS", args)
      console.log("DATA", data)
      console.log("ID: ========> " + args.id)
      const doc = await FirebaseAdmin.firestore().collection("scrapers").doc(id).get();
      return {id: doc.id, ...doc.data()}
    }
  },
};

const startApolloServer = async (app, httpServer) => {
  const server = new ApolloServer({
    playground: true,
    introspection: true,
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();
  server.applyMiddleware({ app });

  setTimeout(function () {
    server.schema = buildSchema()
  }, 10000)
}

startApolloServer(app, httpServer);



export default httpServer;



try {
  admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.NEXT_FIREBASE_ADMIN)),
  })

  admin.firestore().settings({
      timestampsInSnapshots: true,
      ignoreUndefinedProperties: true
  })
} catch (error) {
  /*
   * We skip the "already exists" message which is
   * not an actual error when we're hot-reloading.
   */
  if (!/already exists/u.test(error.message)) {
      console.error('Firebase admin initialization error', error.stack)
  }
}
class FirebaseAdmin {

  static firestore() {
      return admin.firestore();
  }

  static serverTimestamp() {
      return admin.firestore.FieldValue.serverTimestamp();
  }

  static auth() {
      return admin.auth();
  }

  static async getCollectionArray(collection) {
      const querySnapshot = await FirebaseAdmin.firestore().collection(collection).get();
      let result = []
      querySnapshot.forEach((doc) => {
          result.push({ ...doc.data(), id: doc.id })
      });
      return result;
  }

}
