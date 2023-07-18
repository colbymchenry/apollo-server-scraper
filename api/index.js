import { ApolloServer, gql } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import http from "http";
import express from "express";
import cors from "cors";
import {config} from "dotenv";
import { FirebaseAdmin } from "./FirebaseServer";

config();

const app = express();
app.use(cors());
app.use(express.json());
const httpServer = http.createServer(app);

const typeDefs = gql`
  type Query {
    scrapers: [Scraper!]
    scraper(id: String): Scraper
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
    scraper: async (id) => {
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