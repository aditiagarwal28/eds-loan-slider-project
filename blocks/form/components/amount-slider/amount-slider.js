function formatINR(value) {
    return new Intl.NumberFormat('en-IN').format(value);
}

export default function createAmountSlider(block) {
    const min = parseInt(block.dataset.min, 10) || 0;
    const max = parseInt(block.dataset.max, 10) || 1000000;
    const step = parseInt(block.dataset.step, 10) || 1000;
    const value = parseInt(block.dataset.default, 10) || min;
    const label = block.dataset.label || 'Select loan amount';

    block.innerHTML = `
        <div class="slider-wrapper">
            <label>${label}</label>

            <input type="range"
                min="${min}"
                max="${max}"
                step="${step}"
                value="${value}"
                class="slider"
            />

            <div class="slider-value">
                Rs. <span>${formatINR(value)}</span>
            </div>
    `;
    const slider = block.querySelector('.slider');
    const display = block.querySelector('.slider-value span');

    slider.addEventListener('input', () => {
        const val = slider.value;
        display.textContent = formatINR(val);

        block.dispatchEvent(new CustomEvent('amount-change', {
            detail: {value: val}
        }));
    });
}