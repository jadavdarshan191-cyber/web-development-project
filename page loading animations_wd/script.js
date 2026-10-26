// ==========================================
// CONFIGURATION & STATE
// ==========================================

const state = {
    style: "spinner",       // 'spinner' | 'dots' | 'blob' | 'cyber'
    duration: 3000,         // Milliseconds for complete 0-100% progress
    theme: "blue",          // 'blue' | 'purple' | 'emerald' | 'amber'
    intervalId: null        // Current animation timer ID
};

// Loader graphics templates
const GRAPHIC_TEMPLATES = {
    spinner: '<div class="spinner" aria-hidden="true"></div>',
    dots: '<div class="dots-loader" aria-hidden="true"><span></span><span></span><span></span></div>',
    blob: '<div class="blob-loader" aria-hidden="true"></div>',
    cyber: '<div class="cyber-loader" aria-hidden="true"></div>'
};

// CSS @keyframes snippets for the inspector modal
const CODE_SNIPPETS = {
    spinner: `/* Circular Dual-Ring Spinner */
.spinner {
    width: 76px;
    height: 76px;
    border: 4px solid rgba(255, 255, 255, 0.08);
    border-top: 4px solid var(--accent-primary);
    border-right: 4px solid var(--accent-secondary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.spinner::after {
    content: "";
    position: absolute;
    inset: 6px;
    border: 3px solid transparent;
    border-bottom: 3px solid var(--accent-primary);
    border-left: 3px solid var(--accent-secondary);
    border-radius: 50%;
    animation: spinReverse 1.5s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes spinReverse {
    to { transform: rotate(0deg); }
}`,

    dots: `/* Staggered Wave Pulse Dots */
.dots-loader {
    display: flex;
    gap: 12px;
    align-items: center;
}

.dots-loader span {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent-primary);
    animation: pulseWave 1.2s ease-in-out infinite;
}

.dots-loader span:nth-child(2) {
    background: var(--accent-secondary);
    animation-delay: 0.2s;
}

.dots-loader span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes pulseWave {
    0%, 100% {
        transform: scale(0.65);
        opacity: 0.4;
    }
    50% {
        transform: scale(1.15);
        opacity: 1;
    }
}`,

    blob: `/* Liquid Morphing Fluid Blob */
.blob-loader {
    width: 76px;
    height: 76px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    box-shadow: 0 0 25px var(--accent-glow);
    animation: morphBlob 3s ease-in-out infinite alternate;
}

@keyframes morphBlob {
    0% {
        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
        transform: rotate(0deg) scale(0.95);
    }
    50% {
        border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
        transform: rotate(180deg) scale(1.05);
    }
    100% {
        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
        transform: rotate(360deg) scale(0.95);
    }
}`,

    cyber: `/* Cyber Radar Scanner */
.cyber-loader {
    position: relative;
    width: 76px;
    height: 76px;
    border: 2px dashed var(--accent-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: spin 4s linear infinite;
}

.cyber-loader::after {
    content: "";
    position: absolute;
    width: 36px;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent-primary));
    transform-origin: 0 0;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}`
};

// Status progression milestones
const LOADING_STAGES = [
    { threshold: 0, text: "Initializing runtime environment..." },
    { threshold: 22, text: "Fetching dynamic stylesheets..." },
    { threshold: 48, text: "Parsing CSS @keyframes animations..." },
    { threshold: 72, text: "Compiling GPU render surfaces..." },
    { threshold: 92, text: "Finalizing layout..." },
    { threshold: 100, text: "Experience ready!" }
];


// ==========================================
// DOM ELEMENTS
// ==========================================

const loaderScreen = document.getElementById("loaderScreen");
const loaderGraphic = document.getElementById("loaderGraphic");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const percentage = document.getElementById("percentage");
const statusText = document.getElementById("statusText");
const slowHint = document.getElementById("slowHint");
const mainContent = document.getElementById("mainContent");

const restartButton = document.getElementById("restartButton");
const styleSelector = document.getElementById("styleSelector");
const speedSelector = document.getElementById("speedSelector");
const colorSelector = document.getElementById("colorSelector");

const viewCodeBtn = document.getElementById("viewCodeBtn");
const codeModal = document.getElementById("codeModal");
const codeSnippetContent = document.getElementById("codeSnippetContent");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalDismissBtn = document.getElementById("modalDismissBtn");
const modalBackdrop = document.getElementById("modalBackdrop");


// ==========================================
// LOADER LOGIC
// ==========================================

function renderLoaderGraphic() {
    loaderGraphic.innerHTML = GRAPHIC_TEMPLATES[state.style] || GRAPHIC_TEMPLATES.spinner;
}

function startLoading() {
    // Clear any existing timer
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }

    renderLoaderGraphic();

    // Prepare Loader Display
    loaderScreen.style.display = "flex";
    loaderScreen.removeAttribute("aria-hidden");
    mainContent.setAttribute("aria-hidden", "true");

    // Force reflow for smooth transition
    void loaderScreen.offsetWidth;

    loaderScreen.style.opacity = "1";
    loaderScreen.style.visibility = "visible";
    mainContent.classList.remove("visible");

    // Reset Progress & ARIA
    let progress = 0;
    progressBar.style.width = "0%";
    percentage.textContent = "0%";
    progressContainer.setAttribute("aria-valuenow", "0");
    statusText.textContent = LOADING_STAGES[0].text;
    slowHint.hidden = true;

    // Calculate tick speed (0-100%)
    const totalSteps = 100;
    const intervalDelay = Math.max(12, Math.floor(state.duration / totalSteps));

    state.intervalId = setInterval(() => {
        progress += 1;

        // Update visuals
        progressBar.style.width = `${progress}%`;
        percentage.textContent = `${progress}%`;
        progressContainer.setAttribute("aria-valuenow", String(progress));

        // Show slow network notice for long durations (>= 5s)
        if (state.duration >= 5000 && progress >= 35 && progress < 90) {
            slowHint.hidden = false;
        }

        // Dynamic stage messaging
        for (let i = LOADING_STAGES.length - 1; i >= 0; i--) {
            if (progress >= LOADING_STAGES[i].threshold) {
                statusText.textContent = LOADING_STAGES[i].text;
                break;
            }
        }

        // Completion
        if (progress >= 100) {
            clearInterval(state.intervalId);
            state.intervalId = null;
            slowHint.hidden = true;

            setTimeout(() => {
                // Exit transition
                loaderScreen.style.opacity = "0";
                loaderScreen.style.visibility = "hidden";
                loaderScreen.setAttribute("aria-hidden", "true");

                mainContent.classList.add("visible");
                mainContent.setAttribute("aria-hidden", "false");

                setTimeout(() => {
                    loaderScreen.style.display = "none";
                }, 600);
            }, 250);
        }
    }, intervalDelay);
}


// ==========================================
// INTERACTIVE STUDIO CONTROLS
// ==========================================

// Style Picker
styleSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill-btn");
    if (!btn) return;

    styleSelector.querySelectorAll(".pill-btn").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
    });

    btn.classList.add("active");
    btn.setAttribute("aria-checked", "true");
    state.style = btn.dataset.style;
    renderLoaderGraphic();
});

// Speed Picker
speedSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill-btn");
    if (!btn) return;

    speedSelector.querySelectorAll(".pill-btn").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
    });

    btn.classList.add("active");
    btn.setAttribute("aria-checked", "true");
    state.duration = parseInt(btn.dataset.speed, 10);
});

// Color Accent Picker
colorSelector.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill-btn");
    if (!btn) return;

    colorSelector.querySelectorAll(".pill-btn").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
    });

    btn.classList.add("active");
    btn.setAttribute("aria-checked", "true");
    state.theme = btn.dataset.color;
    document.body.setAttribute("data-theme", state.theme);
});

// Replay Button
restartButton.addEventListener("click", () => {
    startLoading();
});

// ==========================================
// CSS CODE INSPECTOR MODAL
// ==========================================

function openCodeModal() {
    const snippet = CODE_SNIPPETS[state.style] || CODE_SNIPPETS.spinner;
    codeSnippetContent.textContent = snippet;
    codeModal.hidden = false;
    modalCloseBtn.focus();
}

function closeCodeModal() {
    codeModal.hidden = true;
    viewCodeBtn.focus();
}

viewCodeBtn.addEventListener("click", openCodeModal);
modalCloseBtn.addEventListener("click", closeCodeModal);
modalDismissBtn.addEventListener("click", closeCodeModal);
modalBackdrop.addEventListener("click", closeCodeModal);

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !codeModal.hidden) {
        closeCodeModal();
    }
});

copyCodeBtn.addEventListener("click", async () => {
    const textToCopy = codeSnippetContent.textContent;
    try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = copyCodeBtn.textContent;
        copyCodeBtn.textContent = "✓ Copied to Clipboard!";
        copyCodeBtn.style.background = "#22c55e";

        setTimeout(() => {
            copyCodeBtn.textContent = originalText;
            copyCodeBtn.style.background = "";
        }, 2000);
    } catch {
        copyCodeBtn.textContent = "Failed to copy";
    }
});


// ==========================================
// INITIALIZATION
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
    renderLoaderGraphic();
    startLoading();
});