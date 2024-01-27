import fs from "fs";

export const routes = {
  home: {
    body: fs.readFileSync("./src/html/home.html"),
  },
};
