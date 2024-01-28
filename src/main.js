import "./style.css";
import Alpine from "alpinejs";
import persist from "@alpinejs/persist";
import feather from "feather-icons";
import "./html/home";

console.log(`feather`, feather);

Alpine.plugin(persist);
Alpine.directive("feather", (el, { value, expression }, { evaluate }) => {
  el.innerHTML = feather.icons[value].toSvg(
    expression ? evaluate(expression) : {},
  );
});

window.Alpine = Alpine;
Alpine.start();
