// import { app, connectDB, env } from "./app";

// const port = env.PORT || 8000;

// connectDB().catch(console.dir);

// app.listen(port, () => {
//   console.log(
//     `Server started running on https://localhost:${port}`,
//     new Date("4-30-2023").getTime()
//   );
// });

import cluster from "cluster";
import os from "os";
import { app, connectDB, env, redisClient } from "./app";

const numCPUs = os.cpus().length;
const port = env.PORT || 8000;

const MAX_RESTARTS = 5;
let restartCount = 0;

if (cluster.isPrimary) {
  cluster.schedulingPolicy = cluster.SCHED_RR;
  // Fork workers (one per CPU core)
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart worker if it crashes
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} crashed. Restarting...`);

    if (restartCount < MAX_RESTARTS) {
      restartCount++;
      console.log(`Restarting worker...`);
      cluster.fork();
    } else {
      console.log(`Max restarts reached. Not forking new workers.`);
    }
  });
} else {
  // Worker processes execute this block
  connectDB().catch(console.dir);

  app.listen(port, () => {
    console.log(`Worker ${process.pid} started on https://localhost:${port}`);
  });

  process.on("SIGTERM", async () => {
    console.log(`Worker ${process.pid} shutting down...`);
    await redisClient.quit();
    process.exit(0);
  });
}
