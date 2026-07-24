import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    {
      path: "/order/*",
      method: "POST",
    },
  ],
});
