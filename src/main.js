import "./style.css";
import Alpine from "alpinejs";
import persist from "@alpinejs/persist";
import "./html/home";

Alpine.plugin(persist);

window.Alpine = Alpine;
Alpine.start();
