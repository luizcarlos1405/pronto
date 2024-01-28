import "./style.css";
import "./data";
import Alpine from "alpinejs";
import persist from "@alpinejs/persist";
import feather from "feather-icons";

Alpine.plugin(persist);
Alpine.directive("feather", (el, { value, expression }, { evaluate }) => {
  el.innerHTML = feather.icons[value].toSvg(
    expression ? evaluate(expression) : {},
  );
});

window.Alpine = Alpine;

Alpine.start();
