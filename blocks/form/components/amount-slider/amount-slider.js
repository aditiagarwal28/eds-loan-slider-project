const PAN_THRESHOLD = 50000;
let panPopupShown = false;

function formatINR(value) {
    return new Intl.NumberFormat('en-IN').format(value);
}

function createPanPopup(block, amount) {
    const overlay = document.createElement('div');
    overlay.className = 'pan-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'pan-popup-title');

    overlay.innerHTML = `
        <div class="pan-popup">
            <button class="pan-popup-close" aria-label="Close">&times;</button>
            <div class="pan-popup-icon">&#128274;</div>
            <h2 id="pan-popup-title" class="pan-popup-title">PAN Details Required</h2>
            <p class="pan-popup-desc">
                As per RBI guidelines, PAN is mandatory for loan amounts above
                <strong>Rs. ${formatINR(PAN_THRESHOLD)}</strong>.
            </p>
            <form class="pan-popup-form" novalidate>
                <div class="pan-field">
                    <label for="pan-input">PAN Number</label>
                    <input
                        id="pan-input"
                        type="text"
                        placeholder="e.g. ABCDE1234F"
                        maxlength="10"
                        autocomplete="off"
                        class="pan-input"
                    />
                    <span class="pan-error" aria-live="polite"></span>
                </div>
                <div class="pan-field">
                    <label for="pan-name">Full Name (as on PAN)</label>
                    <input
                        id="pan-name"
                        type="text"
                        placeholder="Full Name"
                        class="pan-name-input"
                    />
                    <span class="pan-name-error" aria-live="polite"></span>
                </div>
                <button type="submit" class="pan-submit-btn">Submit &amp; Continue</button>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('pan-overlay--visible'));

    const closePopup = () => {
        overlay.classList.remove('pan-overlay--visible');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
        panPopupShown = false;
    };

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePopup();
    });

    // Close button
    overlay.querySelector('.pan-popup-close').addEventListener('click', closePopup);

    // Close on Escape key
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);

    // Form validation & submit
    const form = overlay.querySelector('.pan-popup-form');
    const panInput = overlay.querySelector('.pan-input');
    const panError = overlay.querySelector('.pan-error');
    const nameInput = overlay.querySelector('.pan-name-input');
    const nameError = overlay.querySelector('.pan-name-error');

    // Auto-uppercase PAN
    panInput.addEventListener('input', () => {
        panInput.value = panInput.value.toUpperCase();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;

        // Validate PAN: format AAAAA9999A
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panInput.value.trim())) {
            panError.textContent = 'Enter a valid 10-character PAN (e.g. ABCDE1234F).';
            panInput.classList.add('pan-input--error');
            valid = false;
        } else {
            panError.textContent = '';
            panInput.classList.remove('pan-input--error');
        }

        // Validate Name
        if (nameInput.value.trim().length < 2) {
            nameError.textContent = 'Please enter your full name.';
            nameInput.classList.add('pan-input--error');
            valid = false;
        } else {
            nameError.textContent = '';
            nameInput.classList.remove('pan-input--error');
        }

        if (!valid) return;

        window.location.href = `/content/eds-loan-slider-project/loan-approved.html?amount=${amount}`;


        closePopup();
    });

    // Focus first input for accessibility
    setTimeout(() => panInput.focus(), 150);
}

function updateBubble(input, element) {
    const step = input.step || 1;
    const max = input.max || 0;
    const min = input.min || 1;
    const value = input.value || 1;
    const current = Math.ceil((value - min) / step);
    const total = Math.ceil((max - min) / step);
    const bubble = element.querySelector('.slider-bubble');
    // during initial render the width is 0. Hence using a default here.
    const bubbleWidth = bubble.getBoundingClientRect().width || 31;
    const left = `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;
    bubble.innerText = `${value}`;
    const steps = {
        '--total-steps': Math.ceil((max - min) / step),
        '--current-steps': Math.ceil((value - min) / step),
    };
    const style = Object.entries(steps).map(([varName, varValue]) => `${varName}:${varValue}`).join(';');
    bubble.style.left = `calc(${left})`;
    element.setAttribute('style', style);
}

export default function createAmountSlider(elementOrFd, fd = {}, container) {
    const isDomElement = elementOrFd instanceof HTMLElement;

    // When called from mappings.js: (element, fd) — element is the DOM node, fd has authored props.
    // When called from form.js createAmountRange: (fd) — elementOrFd is the field definition object.
    const dataset = isDomElement ? elementOrFd.dataset : {};
    const fieldDef = isDomElement ? fd : elementOrFd;

    // Authored properties may live on fieldDef directly or under fieldDef.properties
    const props = fieldDef?.properties ?? {};

    const min = parseInt(dataset.min ?? fieldDef.minimum ?? props.minimum ?? fieldDef.min ?? props.min ?? 0, 10,) || 0;
    const max = parseInt(dataset.max ?? fieldDef.maximum ?? props.maximum ?? fieldDef.max ?? props.max ?? 1000000, 10,) || 1000000;
    const step = parseInt(dataset.step ?? fieldDef.step ?? props.step ?? 1000, 10,) || 1000;
    // component-models.json uses "default" as the default value field name
    const value = parseInt(
        dataset.default
        ?? fieldDef.default
        ?? props.default
        ?? fieldDef.defaultValue
        ?? props.defaultValue
        ?? fieldDef.value
        ?? min,
        10,
    ) || min;
    // component-models.json uses "jcr:title" for the label
    const label = dataset.label
        ?? fieldDef['jcr:title']
        ?? fieldDef.label?.value
        ?? fieldDef.label
        ?? props.label
        ?? 'Select loan amount';

    const wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper';
    wrapper.innerHTML = `
        <label>${label}</label>
        <div class="slider-track-wrapper">
            <span class="slider-bubble"></span>
            <input type="range"
                min="${min}"
                max="${max}"
                step="${step}"
                value="${value}"
                class="slider"
            />
            <div class="slider-minmax-wrapper">
                <span class="slider-min-label">${formatINR(min)}</span>
                <span class="slider-max-label">${formatINR(max)}</span>
            </div>
        </div>
    `;

    const slider = wrapper.querySelector('.slider');

    const form = elementOrFd.closest('form') || container.closest('form');

    const observer = new MutationObserver(() => {
        const loanInput = form.querySelector('.field-loan-input');       
        if (loanInput) {
            observer.disconnect();
            const fieldLoanInput = loanInput.querySelector('input');
            fieldLoanInput.addEventListener('change', (e) => {
                slider.value = e.target.value
                updateBubble(slider, wrapper);
                if(e.target.value > PAN_THRESHOLD) {
                    createPanPopup(eventTarget, e.target.value);
                }
            });

            form.addEventListener('submit', () => {
                if(fieldLoanInput.value > PAN_THRESHOLD) {
                    createPanPopup(eventTarget, fieldLoanInput.value);
                } else {
                    window.location.href = `/content/eds-loan-slider-project/loan-approved.html?amount=${fieldLoanInput.value}`;
                }
            });
        }
    });

    observer.observe(form, { childList: true, subtree: true });
    // The element that receives custom events — the real DOM container.
    const eventTarget = isDomElement ? elementOrFd : wrapper;

    slider.addEventListener('input', (e) => {
        updateBubble(e.target, wrapper);
    });

    slider.addEventListener('change', (e) => {
        const loanInput = container.querySelector('.field-loan-input');
        const fieldLoanInput = loanInput?.querySelector('input');
        const val = parseInt(e.target.value, 10);
        fieldLoanInput.value = val;

        eventTarget.dispatchEvent(new CustomEvent('amount-change', {
            bubbles: true,
            detail: { value: val },
        }));

        // Show PAN popup once when threshold is crossed
        if (val > PAN_THRESHOLD && !panPopupShown) {
            panPopupShown = true;
            createPanPopup(eventTarget, val);
        }

        // Reset flag if slider goes back below threshold
        if (val <= PAN_THRESHOLD) {
            panPopupShown = false;
        }
    });

      // If called as a standalone block decorator, replace block content.
    if (isDomElement) {
        elementOrFd.innerHTML = '';
        elementOrFd.appendChild(wrapper);
        updateBubble(slider, wrapper);
        // Show popup if default value already exceeds threshold
        if (value > PAN_THRESHOLD) {
            panPopupShown = true;
            createPanPopup(elementOrFd);
        }
        return elementOrFd;
    }

    // Called from form.js — return the wrapper element to be appended.
    updateBubble(slider, wrapper);
    if (value > PAN_THRESHOLD) {
        panPopupShown = true;
        createPanPopup(wrapper);
    }
    return wrapper;

    // Called from form.js — return the wrapper element to be appended.
    updateBubble(slider, wrapper);
    if (value > PAN_THRESHOLD) {
        panPopupShown = true;
        createPanPopup(wrapper);
    }
    return wrapper;
}
