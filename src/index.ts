import { app, env } from "./app";

const port = env.PORT || 8000;

app.listen(port, () => {
  console.log(
    `Server started running on https://localhost:${port}`,
    new Date("4-30-2023").getTime()
  );
});
