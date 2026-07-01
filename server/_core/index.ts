import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust the first hop's X-Forwarded-* headers. Most hosts that put this
  // app behind a reverse proxy (Railway, Render, Fly.io, a single nginx in
  // front) add exactly one proxy hop, so `req.ip` then reflects the real
  // client IP — which the login rate limiter below depends on. If you ever
  // add a CDN/extra proxy layer in front, bump this number to match.
  app.set("trust proxy", 1);

  // Security headers. CSP is left off here on purpose: this app loads fonts
  // and other external/inline sources, and a default strict CSP would block
  // those. Add a tailored Content-Security-Policy once you know every
  // external host you load from.
  app.use(helmet({ contentSecurityPolicy: false }));

  // No file uploads in this app — 1mb comfortably fits normal form payloads.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // Basic abuse protection on the API: caps how many requests a single IP
  // can make per minute. tRPC can batch several calls into one HTTP request,
  // so this is a coarse limit, not a per-action one — it's meant to stop
  // scripted spam/DoS, not to police normal browsing. The admin login itself
  // has its own, much stricter throttle — see server/adminAuth.ts.
  app.use(
    "/api/trpc",
    rateLimit({
      windowMs: 60 * 1000,
      limit: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
    })
  );

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
