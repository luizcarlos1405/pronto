import virtualHtml from "vite-plugin-virtual-html";
import { pages } from "./src/pages";
import Mustache from "mustache";
import fs from "fs";

export default {
  plugins: [
    virtualHtml({
      pages,
      indexPage: "home",
      render: (template, data) => {
        const layoutTemplate = fs.readFileSync("index.html", {
          encoding: "utf8",
          flag: "r",
        });

        return Mustache.render(layoutTemplate, { ...data, body: template });
      },
    }),
  ],
};
