const PAN_THRESHOLD = 50000;

function formatINR(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function createPanPopup(block) {
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
                        placeholder="e.g. Rahul Sharma"
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

    // Dispatch event with PAN details
        block.dispatchEvent(new CustomEvent('pan-submitted', {
        bubbles: true,
        detail: {
          pan: panInput.value.trim(),
          name: nameInput.value.trim(),
        },
        }));

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
  const bubble = element.querySelector('.range-bubble');
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
export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');
  // modify the type in case it is not range.
  input.type = 'range';
  input.min = input.min || 1;
  input.max = input.max || 100;
  input.step = fieldJson?.properties?.stepValue || 1;
  // create a wrapper div to provide the min/max and current value
  const div = document.createElement('div');
  div.className = 'range-widget-wrapper decorated';
  input.after(div);
  const hover = document.createElement('span');
  hover.className = 'range-bubble';
  const rangeMinEl = document.createElement('span');
  rangeMinEl.className = 'range-min';
  const rangeMaxEl = document.createElement('span');
  rangeMaxEl.className = 'range-max';
  rangeMinEl.innerText = `${input.min || 1}`;
  rangeMaxEl.innerText = `${input.max}`;
  div.appendChild(hover);
  // move the input element within the wrapper div
  div.appendChild(input);
  div.appendChild(rangeMinEl);
  div.appendChild(rangeMaxEl);
  let panPopupShown = false;

  const eventTarget = fieldDiv;
  
  input.addEventListener('input', (e) => {
    const val = parseInt(e.target, 10);
    updateBubble(e.target, div);
    //display.textContent = formatINR(val);
    //updateTooltipPosition();

    eventTarget.dispatchEvent(new CustomEvent('amount-change', {
        bubbles: true,
        detail: { value: val },
    }));

    // Show PAN popup once when threshold is crossed
    if (val > PAN_THRESHOLD && !panPopupShown) {
      panPopupShown = true;
      createPanPopup(eventTarget);
    }

    // Reset flag if slider goes back below threshold
    if (val <= PAN_THRESHOLD) {
      panPopupShown = false;
    }
  });
  updateBubble(input, div);
  return fieldDiv;
}
