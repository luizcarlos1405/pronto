import virtualHtml from "vite-plugin-virtual-html";
import Mustache from "mustache";
import { routes } from "./src/routes";

export default {
  plugins: [
    virtualHtml({
      pages: Object.fromEntries(
        Object.entries(routes).map(([key, value]) => [
          key,
          {
            template: "/index.html",
            render: async (layout) => Mustache.render(layout, value),
            ...value,
          },
        ]),
      ),
      indexPage: "home",
    }),
  ],
};
