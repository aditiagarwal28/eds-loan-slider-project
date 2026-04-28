function formatINR(value) {
    return new Intl.NumberFormat('en-IN').format(value);
}

export default function loanApprovedBlock(block) {
    const params = new URLSearchParams(window.location.search);
    const amount = parseInt(params.get('amount'), 10);

    block.innerHTML = `
        <div class="loan-approved-card">
            <div class="loan-approved-icon" aria-hidden="true">&#10003;</div>
            <h1 class="loan-approved-title">Loan Approved!</h1>
            <p class="loan-approved-subtitle">Congratulations! Your loan request has been approved.</p>
            <div class="loan-approved-amount-wrapper">
                <span class="loan-approved-amount-label">Approved Amount</span>
                <span class="loan-approved-amount">&#8377;&nbsp;${amount ? formatINR(amount) : '—'}</span>
            </div>
            <ul class="loan-approved-steps">
                <li>Our team will contact you within 24 hours.</li>
                <li>Keep your KYC documents ready for verification.</li>
                <li>Funds will be disbursed within 3 working days post verification.</li>
            </ul>
            <a href="/" class="loan-approved-cta">Back to Home</a>
        </div>
    `;
}
