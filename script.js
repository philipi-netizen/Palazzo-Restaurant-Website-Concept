/*
 * =========================================================
 * THE PALAZZO RESTAURANT
 * Premium Vanilla JavaScript
 * Blantyre, Malawi
 *
 * Premium interaction / scroll system.
 *
 * Existing HTML architecture and selectors are preserved.
 * Additional behaviour is layered on top rather than
 * replacing the existing structure.
 * =========================================================
 */

document.documentElement.classList.add("js-enabled");


/* =========================================================
   GLOBAL STATE
   ========================================================= */

const PalazzoState = {
    reducedMotion: false,
    mobile: false,
    ticking: false,
    parallaxElements: [],
    revealObserver: null,
    activeNavigationObserver: null
};


/* =========================================================
   GLOBAL INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    PalazzoState.reducedMotion = prefersReducedMotion();
    PalazzoState.mobile = isMobileViewport();

    const initialisers = [
        initPreloader,
        initNavigation,
        initScrollReveal,
        initParallax,
        initScrollProgress,
        initWhatsAppLinks,
        initFaq,
        initGallery,
        initActiveNavigation,
        initImageLoading,
        initDynamicViewport
    ];

    initialisers.forEach((initialiser) => {
        try {
            initialiser();
        } catch (_) {
            /*
             * Individual enhancements must never prevent
             * the rest of the website from functioning.
             */
        }
    });

    requestGlobalScrollUpdate();
});


/* =========================================================
   HELPERS
   ========================================================= */

function prefersReducedMotion() {
    try {
        return window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
    } catch (_) {
        return false;
    }
}


function isMobileViewport() {
    return window.innerWidth <= 1023;
}


function getHeaderOffset() {
    const header =
        document.querySelector("#site-header");

    if (!header) {
        return 0;
    }

    return header.getBoundingClientRect().height;
}


function clamp(value, min, max) {
    return Math.min(
        Math.max(value, min),
        max
    );
}


function lerp(start, end, amount) {
    return start + (end - start) * amount;
}


function requestGlobalScrollUpdate() {
    if (PalazzoState.ticking) {
        return;
    }

    PalazzoState.ticking = true;

    window.requestAnimationFrame(() => {
        updateHeaderScrollState();
        updateParallaxValues();
        updateScrollProgress();

        PalazzoState.ticking = false;
    });
}


function scrollToTarget(target) {
    if (!target) {
        return;
    }

    const headerOffset =
        getHeaderOffset();

    const targetTop =
        target.getBoundingClientRect().top +
        window.pageYOffset -
        headerOffset -
        8;

    window.scrollTo({
        top: Math.max(0, targetTop),
        behavior:
            prefersReducedMotion()
                ? "auto"
                : "smooth"
    });
}


/* =========================================================
   PRELOADER
   ========================================================= */

function initPreloader() {
    const preloader =
        document.querySelector("#preloader");

    if (!preloader) {
        return;
    }

    let finished = false;
    let fallbackTimer = null;
    let hideTimer = null;


    const hidePreloader = () => {
        if (finished) {
            return;
        }

        finished = true;

        if (fallbackTimer) {
            window.clearTimeout(
                fallbackTimer
            );
        }

        preloader.classList.add(
            "is-hidden"
        );

        preloader.setAttribute(
            "aria-hidden",
            "true"
        );

        hideTimer = window.setTimeout(() => {
            preloader.hidden = true;
        }, 950);

        void hideTimer;
    };


    const waitForCriticalImages = () => {

        const criticalImages =
            Array.from(
                document.images
            ).filter((image) => {

                const isPreloaderLogo =
                    Boolean(
                        image.closest(
                            "#preloader"
                        )
                    );

                const isHeroImage =
                    Boolean(
                        image.closest(
                            ".hero"
                        )
                    );

                const isLazy =
                    image.loading === "lazy" ||
                    (
                        image.hasAttribute(
                            "loading"
                        ) &&
                        image.getAttribute(
                            "loading"
                        ) === "lazy"
                    );

                return (
                    isPreloaderLogo ||
                    (
                        isHeroImage &&
                        !isLazy
                    )
                );
            });


        if (!criticalImages.length) {
            hidePreloader();
            return;
        }


        let remaining =
            criticalImages.length;


        const markComplete = () => {
            remaining -= 1;

            if (remaining <= 0) {
                hidePreloader();
            }
        };


        criticalImages.forEach((image) => {

            if (image.complete) {
                markComplete();
                return;
            }


            image.addEventListener(
                "load",
                markComplete,
                { once: true }
            );


            image.addEventListener(
                "error",
                markComplete,
                { once: true }
            );
        });
    };


    /*
     * Hard maximum loader duration.
     */
    fallbackTimer =
        window.setTimeout(
            hidePreloader,
            3500
        );


    /*
     * Don't wait unnecessarily if the document has
     * already finished loading.
     */
    if (
        document.readyState ===
        "complete"
    ) {
        waitForCriticalImages();
    } else {
        window.addEventListener(
            "load",
            waitForCriticalImages,
            { once: true }
        );
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initNavigation() {

    const header =
        document.querySelector(
            "#site-header"
        );

    const desktopNav =
        document.querySelector(
            "#main-navigation"
        );

    const mobileNav =
        document.querySelector(
            "#mobile-navigation"
        );

    const toggle =
        document.querySelector(
            "#mobile-menu-toggle"
        );


    if (!header) {
        return;
    }


    /* -----------------------------------------------------
       Mobile menu
       ----------------------------------------------------- */

    const openMobileMenu = () => {

        if (!toggle || !mobileNav) {
            return;
        }

        toggle.setAttribute(
            "aria-expanded",
            "true"
        );

        toggle.setAttribute(
            "aria-label",
            "Close navigation"
        );

        mobileNav.hidden = false;

        mobileNav.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "is-menu-open"
        );

        header.setAttribute(
            "aria-expanded",
            "true"
        );
    };


    const closeMobileMenu = () => {

        if (!toggle || !mobileNav) {
            return;
        }

        toggle.setAttribute(
            "aria-expanded",
            "false"
        );

        toggle.setAttribute(
            "aria-label",
            "Open navigation"
        );

        mobileNav.setAttribute(
            "aria-hidden",
            "true"
        );

        mobileNav.hidden = true;

        document.body.classList.remove(
            "is-menu-open"
        );

        updateHeaderScrollState();
    };


    if (toggle && mobileNav) {

        toggle.addEventListener(
            "click",
            () => {

                const isOpen =
                    toggle.getAttribute(
                        "aria-expanded"
                    ) === "true";

                if (isOpen) {
                    closeMobileMenu();
                } else {
                    openMobileMenu();
                }
            }
        );


        /*
         * Always synchronise the initial state.
         */
        if (
            toggle.getAttribute(
                "aria-expanded"
            ) === "true"
        ) {
            openMobileMenu();
        } else {
            closeMobileMenu();
        }
    }


    /* -----------------------------------------------------
       Navigation links
       ----------------------------------------------------- */

    const navigationLinks =
        document.querySelectorAll(
            ".site-header__nav-link.js-navigation, " +
            ".mobile-navigation__link.js-navigation"
        );


    navigationLinks.forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !href ||
                    !href.startsWith("#")
                ) {
                    return;
                }


                const target =
                    document.querySelector(
                        href
                    );


                if (!target) {
                    return;
                }


                event.preventDefault();


                if (
                    toggle &&
                    mobileNav
                ) {
                    closeMobileMenu();
                }


                window.setTimeout(() => {

                    scrollToTarget(
                        target
                    );


                    try {
                        window.history.pushState(
                            null,
                            "",
                            href
                        );
                    } catch (_) {
                        /*
                         * Ignore History API failures.
                         */
                    }

                }, 40);
            }
        );
    });


    /* -----------------------------------------------------
       Escape
       ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


            if (
                !toggle ||
                !mobileNav ||
                toggle.getAttribute(
                    "aria-expanded"
                ) !== "true"
            ) {
                return;
            }


            closeMobileMenu();

            toggle.focus();
        }
    );


    /* -----------------------------------------------------
       Desktop navigation state
       ----------------------------------------------------- */

    if (desktopNav) {
        desktopNav.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    updateHeaderScrollState();
}


/* =========================================================
   HEADER SCROLL STATE
   ========================================================= */

function updateHeaderScrollState() {

    const header =
        document.querySelector(
            "#site-header"
        );

    if (!header) {
        return;
    }


    const toggle =
        document.querySelector(
            "#mobile-menu-toggle"
        );


    const mobileMenuOpen =
        toggle &&
        toggle.getAttribute(
            "aria-expanded"
        ) === "true";


    const scrolled =
        window.scrollY > 24;


    header.setAttribute(
        "aria-expanded",
        (
            scrolled ||
            mobileMenuOpen
        )
            ? "true"
            : "false"
    );


    /*
     * Additional state class gives CSS a clean hook
     * for premium header transformations.
     */
    header.classList.toggle(
        "is-scrolled",
        scrolled
    );
}


/* =========================================================
   SCROLL REVEAL
   ========================================================= */

function initScrollReveal() {

    const revealElements =
        document.querySelectorAll(
            "[data-reveal]"
        );


    if (!revealElements.length) {
        return;
    }


    const showElement = (
        element
    ) => {

        if (!element) {
            return;
        }


        element.classList.add(
            "is-visible"
        );
    };


    /*
     * Reduced motion / unsupported browsers:
     * show everything immediately.
     */
    if (
        PalazzoState.reducedMotion ||
        !(
            "IntersectionObserver" in
            window
        )
    ) {

        revealElements.forEach(
            showElement
        );

        return;
    }


    try {

        PalazzoState.revealObserver =
            new IntersectionObserver(
                (
                    entries,
                    observer
                ) => {

                    entries.forEach(
                        (entry) => {

                            if (
                                !entry.isIntersecting
                            ) {
                                return;
                            }


                            const element =
                                entry.target;


                            /*
                             * Preserve explicit
                             * data-reveal-delay values.
                             */
                            const delay =
                                element.getAttribute(
                                    "data-reveal-delay"
                                );


                            if (delay) {

                                const numericDelay =
                                    Number.parseInt(
                                        delay,
                                        10
                                    );


                                if (
                                    Number.isFinite(
                                        numericDelay
                                    )
                                ) {

                                    element.style.setProperty(
                                        "--reveal-delay",
                                        `${numericDelay}ms`
                                    );
                                }
                            }


                            /*
                             * Stagger child elements where
                             * the markup allows it.
                             */
                            element.style.setProperty(
                                "--reveal-index",
                                "0"
                            );


                            showElement(
                                element
                            );


                            observer.unobserve(
                                element
                            );
                        }
                    );
                },
                {
                    threshold: 0.12,
                    rootMargin:
                        "0px 0px -8% 0px"
                }
            );


        revealElements.forEach(
            (element) => {

                /*
                 * Ensure CSS knows this is an element
                 * intended for viewport choreography.
                 */
                element.classList.add(
                    "reveal-ready"
                );

                PalazzoState
                    .revealObserver
                    .observe(element);
            }
        );


        /*
         * Fail-safe.
         */
        window.setTimeout(
            () => {

                revealElements.forEach(
                    (element) => {

                        if (
                            !element.classList.contains(
                                "is-visible"
                            )
                        ) {
                            showElement(
                                element
                            );
                        }
                    }
                );

            },
            5000
        );

    } catch (_) {

        revealElements.forEach(
            showElement
        );
    }
}


/* =========================================================
   PARALLAX
   ========================================================= */

function initParallax() {

    PalazzoState.parallaxElements =
        Array.from(
            document.querySelectorAll(
                "[data-parallax]"
            )
        );


    if (
        !PalazzoState.parallaxElements.length
    ) {
        return;
    }


    /*
     * Register CSS-friendly state.
     */
    PalazzoState.parallaxElements
        .forEach((element) => {

            element.classList.add(
                "parallax-ready"
            );

            element.style.setProperty(
                "--parallax-y",
                "0px"
            );
        });


    requestGlobalScrollUpdate();
}


/* ---------------------------------------------------------
   Parallax calculation
   --------------------------------------------------------- */

function updateParallaxValues() {

    const elements =
        PalazzoState.parallaxElements;


    if (!elements.length) {
        return;
    }


    if (
        PalazzoState.reducedMotion ||
        PalazzoState.mobile
    ) {

        elements.forEach(
            (element) => {

                element.style.setProperty(
                    "--parallax-y",
                    "0px"
                );

                element.style.transform =
                    "translate3d(0, 0, 0)";
            }
        );

        return;
    }


    const viewportHeight =
        window.innerHeight ||
        document.documentElement
            .clientHeight;


    elements.forEach((element) => {

        const rect =
            element.getBoundingClientRect();


        /*
         * Completely outside viewport.
         */
        if (
            rect.bottom < -100 ||
            rect.top >
                viewportHeight + 100
        ) {

            element.style.setProperty(
                "--parallax-y",
                "0px"
            );

            return;
        }


        const elementCenter =
            rect.top +
            rect.height / 2;


        const viewportCenter =
            viewportHeight / 2;


        let progress =
            (
                elementCenter -
                viewportCenter
            ) /
            viewportHeight;


        progress =
            clamp(
                progress,
                -1,
                1
            );


        /*
         * Restrained movement.
         *
         * Enough to create depth without looking
         * like an obvious scrolling effect.
         */
        const movement =
            progress * -28;


        element.style.setProperty(
            "--parallax-y",
            `${movement.toFixed(2)}px`
        );


        /*
         * Keep the existing inline transform
         * architecture functional.
         */
        element.style.transform =
            `translate3d(0, ${movement.toFixed(2)}px, 0)`;
    });
}


/* =========================================================
   SCROLL PROGRESS
   ========================================================= */

function initScrollProgress() {

    const root =
        document.documentElement;


    const update = () => {

        const scrollTop =
            window.scrollY || 0;


        const scrollHeight =
            document.documentElement
                .scrollHeight -
            window.innerHeight;


        if (scrollHeight <= 0) {

            root.style.setProperty(
                "--scroll-progress",
                "0"
            );

            return;
        }


        const progress =
            clamp(
                scrollTop /
                scrollHeight,
                0,
                1
            );


        root.style.setProperty(
            "--scroll-progress",
            progress.toFixed(4)
        );
    };


    update();


    /*
     * Use the shared animation loop.
     */
    window.addEventListener(
        "scroll",
        requestGlobalScrollUpdate,
        { passive: true }
    );


    /*
     * Make sure the initial value is available.
     */
    window.setTimeout(
        update,
        100
    );
}


function updateScrollProgress() {

    const root =
        document.documentElement;


    const scrollTop =
        window.scrollY || 0;


    const scrollHeight =
        document.documentElement
            .scrollHeight -
        window.innerHeight;


    if (scrollHeight <= 0) {

        root.style.setProperty(
            "--scroll-progress",
            "0"
        );

        return;
    }


    const progress =
        clamp(
            scrollTop /
            scrollHeight,
            0,
            1
        );


    root.style.setProperty(
        "--scroll-progress",
        progress.toFixed(4)
    );
}


/* =========================================================
   WHATSAPP
   ========================================================= */

function initWhatsAppLinks() {

    const links =
        document.querySelectorAll(
            ".js-whatsapp"
        );


    if (!links.length) {
        return;
    }


    const phoneNumber =
        "265882499865";


    links.forEach((link) => {

        try {

            const message =
                link.getAttribute(
                    "data-whatsapp-message"
                );


            let url =
                `https://wa.me/${phoneNumber}`;


            if (message) {

                url +=
                    `?text=${encodeURIComponent(
                        message
                    )}`;
            }


            link.setAttribute(
                "href",
                url
            );


            link.setAttribute(
                "target",
                "_blank"
            );


            link.setAttribute(
                "rel",
                "noopener noreferrer"
            );

        } catch (_) {
            /*
             * Preserve the existing link if anything
             * unexpected occurs.
             */
        }
    });
}


/* =========================================================
   FAQ
   ========================================================= */

function initFaq() {

    const faq =
        document.querySelector(
            ".js-faq"
        );


    if (!faq) {
        return;
    }


    const buttons =
        faq.querySelectorAll(
            ".js-faq-button"
        );


    if (!buttons.length) {
        return;
    }


    const getPanelForButton =
        (button, index) => {

            const declaredId =
                button.getAttribute(
                    "aria-controls"
                );


            if (declaredId) {

                const declaredPanel =
                    document.getElementById(
                        declaredId
                    );


                if (declaredPanel) {
                    return declaredPanel;
                }
            }


            return document.getElementById(
                `faq-panel-${index + 1}`
            );
        };


    const closeItem =
        (button, panel) => {

            if (!button || !panel) {
                return;
            }


            button.setAttribute(
                "aria-expanded",
                "false"
            );


            panel.setAttribute(
                "aria-hidden",
                "true"
            );


            panel.hidden = true;
        };


    const openItem =
        (button, panel) => {

            if (!button || !panel) {
                return;
            }


            button.setAttribute(
                "aria-expanded",
                "true"
            );


            panel.setAttribute(
                "aria-hidden",
                "false"
            );


            panel.hidden = false;
        };


    buttons.forEach(
        (button, index) => {

            const panel =
                getPanelForButton(
                    button,
                    index
                );


            if (!panel) {
                return;
            }


            button.setAttribute(
                "aria-controls",
                panel.id
            );


            closeItem(
                button,
                panel
            );


            button.addEventListener(
                "click",
                () => {

                    const isOpen =
                        button.getAttribute(
                            "aria-expanded"
                        ) === "true";


                    buttons.forEach(
                        (
                            otherButton,
                            otherIndex
                        ) => {

                            const otherPanel =
                                getPanelForButton(
                                    otherButton,
                                    otherIndex
                                );


                            if (
                                otherButton !==
                                button
                            ) {

                                closeItem(
                                    otherButton,
                                    otherPanel
                                );
                            }
                        }
                    );


                    if (isOpen) {

                        closeItem(
                            button,
                            panel
                        );

                    } else {

                        openItem(
                            button,
                            panel
                        );
                    }
                }
            );
        }
    );


    /* -----------------------------------------------------
       Keyboard navigation
       ----------------------------------------------------- */

    buttons.forEach(
        (button, index) => {

            button.addEventListener(
                "keydown",
                (event) => {

                    let targetIndex =
                        null;


                    switch (
                        event.key
                    ) {

                        case "ArrowDown":

                            targetIndex =
                                (
                                    index + 1
                                ) %
                                buttons.length;

                            break;


                        case "ArrowUp":

                            targetIndex =
                                (
                                    index -
                                    1 +
                                    buttons.length
                                ) %
                                buttons.length;

                            break;


                        case "Home":

                            targetIndex =
                                0;

                            break;


                        case "End":

                            targetIndex =
                                buttons.length -
                                1;

                            break;


                        default:
                            return;
                    }


                    event.preventDefault();


                    buttons[
                        targetIndex
                    ]?.focus();
                }
            );
        }
    );
}


/* =========================================================
   GALLERY
   ========================================================= */

function initGallery() {

    const gallery =
        document.querySelector(
            ".js-gallery"
        );


    if (!gallery) {
        return;
    }


    const images =
        gallery.querySelectorAll(
            "img"
        );


    images.forEach((image) => {

        const markLoaded = () => {

            image.classList.add(
                "is-image-loaded"
            );
        };


        const markError = () => {

            image.classList.add(
                "is-image-error"
            );
        };


        image.addEventListener(
            "load",
            markLoaded,
            { once: true }
        );


        image.addEventListener(
            "error",
            markError,
            { once: true }
        );


        if (image.complete) {

            if (
                image.naturalWidth > 0
            ) {

                markLoaded();

            } else {

                markError();
            }
        }
    });
}


/* =========================================================
   IMAGE LOADING
   ========================================================= */

function initImageLoading() {

    const images =
        document.querySelectorAll(
            "img"
        );


    if (!images.length) {
        return;
    }


    images.forEach((image) => {

        const markLoaded = () => {

            image.classList.add(
                "is-image-loaded"
            );

            image.classList.remove(
                "is-image-error"
            );
        };


        const markError = () => {

            image.classList.add(
                "is-image-error"
            );
        };


        if (image.complete) {

            if (
                image.naturalWidth > 0
            ) {

                markLoaded();

            } else {

                markError();
            }

            return;
        }


        image.addEventListener(
            "load",
            markLoaded,
            { once: true }
        );


        image.addEventListener(
            "error",
            markError,
            { once: true }
        );
    });
}


/* =========================================================
   ACTIVE NAVIGATION
   ========================================================= */

function initActiveNavigation() {

    const navLinks =
        document.querySelectorAll(
            ".site-header__nav-link.js-navigation"
        );


    if (!navLinks.length) {
        return;
    }


    const sectionIds = [
        "home",
        "intro",
        "menu",
        "experience",
        "reviews",
        "gallery",
        "visit"
    ];


    const sections =
        sectionIds
            .map((id) =>
                document.getElementById(
                    id
                )
            )
            .filter(Boolean);


    if (!sections.length) {
        return;
    }


    const setActiveLink =
        (id) => {

            navLinks.forEach(
                (link) => {

                    const href =
                        link.getAttribute(
                            "href"
                        );


                    const isActive =
                        href ===
                        `#${id}`;


                    link.classList.toggle(
                        "is-active",
                        isActive
                    );


                    if (isActive) {

                        link.setAttribute(
                            "aria-current",
                            "page"
                        );

                    } else {

                        link.removeAttribute(
                            "aria-current"
                        );
                    }
                }
            );
        };


    if (
        !(
            "IntersectionObserver" in
            window
        )
    ) {
        return;
    }


    try {

        PalazzoState
            .activeNavigationObserver =
            new IntersectionObserver(
                (entries) => {

                    const visible =
                        entries
                            .filter(
                                (entry) =>
                                    entry.isIntersecting
                            )
                            .sort(
                                (a, b) =>
                                    b.intersectionRatio -
                                    a.intersectionRatio
                            );


                    if (
                        visible.length
                    ) {

                        setActiveLink(
                            visible[0]
                                .target
                                .id
                        );
                    }
                },
                {
                    rootMargin:
                        `-${getHeaderOffset()}px 0px -55% 0px`,
                    threshold: [
                        0.1,
                        0.25,
                        0.5,
                        0.75
                    ]
                }
            );


        sections.forEach(
            (section) => {

                PalazzoState
                    .activeNavigationObserver
                    .observe(section);
            }
        );

    } catch (_) {
        /*
         * Active state is enhancement only.
         */
    }
}


/* =========================================================
   DYNAMIC VIEWPORT / RESIZE
   ========================================================= */

function initDynamicViewport() {

    let resizeTimer = null;


    const handleResize = () => {

        if (resizeTimer) {
            window.clearTimeout(
                resizeTimer
            );
        }


        resizeTimer =
            window.setTimeout(
                () => {

                    PalazzoState.mobile =
                        isMobileViewport();


                    PalazzoState
                        .reducedMotion =
                        prefersReducedMotion();


                    /*
                     * Close mobile menu when entering
                     * desktop layout.
                     */
                    if (
                        !PalazzoState.mobile
                    ) {

                        const toggle =
                            document.querySelector(
                                "#mobile-menu-toggle"
                            );

                        const mobileNav =
                            document.querySelector(
                                "#mobile-navigation"
                            );


                        if (
                            toggle &&
                            mobileNav
                        ) {

                            toggle.setAttribute(
                                "aria-expanded",
                                "false"
                            );

                            toggle.setAttribute(
                                "aria-label",
                                "Open navigation"
                            );

                            mobileNav.setAttribute(
                                "aria-hidden",
                                "true"
                            );

                            mobileNav.hidden =
                                true;

                            document.body
                                .classList
                                .remove(
                                    "is-menu-open"
                                );
                        }
                    }


                    /*
                     * Recalculate active navigation
                     * positioning after header changes.
                     */
                    updateHeaderScrollState();


                    requestGlobalScrollUpdate();

                },
                120
            );
    };


    window.addEventListener(
        "resize",
        handleResize,
        {
            passive: true
        }
    );


    /*
     * React to reduced-motion preference changes.
     */
    try {

        const motionQuery =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            );


        motionQuery.addEventListener(
            "change",
            () => {

                PalazzoState
                    .reducedMotion =
                    motionQuery.matches;


                requestGlobalScrollUpdate();
            }
        );

    } catch (_) {
        /*
         * Older browsers can safely ignore this.
         */
    }
}


/* =========================================================
   GLOBAL SCROLL LISTENER
   ========================================================= */

window.addEventListener(
    "scroll",
    requestGlobalScrollUpdate,
    {
        passive: true
    }
);


/* =========================================================
   FINAL SAFETY
   ========================================================= */

window.addEventListener(
    "pageshow",
    () => {

        /*
         * Some browsers restore scroll position from the
         * back/forward cache. Recalculate everything.
         */
        requestGlobalScrollUpdate();
        updateHeaderScrollState();
    }
);