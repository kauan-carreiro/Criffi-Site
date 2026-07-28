import { initProductModal } from "./modal.js";
import { initProductsCatalog } from "./products.js";

function initMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");

    if (!toggle || !nav) {
        return;
    }

    const links = nav.querySelectorAll("a");

    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        toggle.classList.toggle("is-active", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("menu-open", isOpen);
    });

    links.forEach((link) => {
        link.addEventListener("click", () => {
            nav.classList.remove("is-open");
            toggle.classList.remove("is-active");
            toggle.setAttribute("aria-expanded", "false");
            document.body.classList.remove("menu-open");
        });
    });
}

function initRevealAnimations() {
    const revealElements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        revealElements.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16 });

    revealElements.forEach((element) => observer.observe(element));
}

initMenu();
initProductModal();
initProductsCatalog();
initRevealAnimations();
