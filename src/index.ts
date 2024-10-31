import { app, connectDB, env } from "./app";

const port = env.PORT || 8000;

connectDB().catch(console.dir);

app.listen(port, () => {
  console.log(
    `Server started running on https://localhost:${port}`,
    new Date("4-30-2023").getTime()
  );
});
