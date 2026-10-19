
import { draw, outcomes, frequencies, csv } from './random.js';
// ============================================================
// 1. INITIAL SETUP
// ============================================================

// Helper function to select elements by ID
const $ = id => document.getElementById(id);

// Check whether the user prefers reduced motion
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Randomly assign the two raffle methods
const swap = Math.random() < 0.5;

// Store information about the current raffle session
const session = {
    version: 2,
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),

    assignment: {
        A: swap ? 'quantum' : 'classical',
        B: swap ? 'classical' : 'quantum'
    },
    draws: [],
    revealedAt: null,
    bulk: []
};

// Track the current application state
let busy = false;
let revealed = false;

// Count individual spins for each machine
const counts = {
    A: 0,
    B: 0
};

// ============================================================
// 2. CREATE THE RAFFLE MACHINES
// ============================================================

$('machines').innerHTML = ['A', 'B'].map(m => `
    <article
        class="machine"
        id="machine${m}"
        role="tabpanel"
        aria-labelledby="tab${m}"
        tabindex="0"
        ${m === 'B' ? 'hidden' : ''}
    >
        <div class="machine-top">
            <span class="machine-label">MACHINE ${m}</span>
            <span class="method" id="method${m}">
                Mystery method
            </span>
        </div>
        <h2>Lucky Spin</h2>
        <div class="reels" aria-hidden="true">
            <span class="reel">?</span>
            <span class="reel">?</span>
            <span class="reel">?</span>
        </div>
        <p class="outcome" id="outcome${m}" role="status">
            Who will be the lucky winner? : o
        </p>
        <p class="count" id="count${m}">
            0 spins so far
        </p>
        <button class="spin" id="spin${m}">
            Spin!
            <span aria-hidden="true">↻</span>
        </button>
    </article>
`).join('');


// ============================================================
// 3. MACHINE TAB NAVIGATION
// ============================================================

// Switch between Machine A and Machine B
function selectMachine(m, focus = false) {

    for (const key of ['A', 'B']) {
        $('machine' + key).hidden = key !== m;

        $('tab' + key).setAttribute(
            'aria-selected',
            String(key === m)
        );

        $('tab' + key).tabIndex = key === m ? 0 : -1;
    }
    if (focus) {
        $('tab' + m).focus();
    }
}

// Set up mouse and keyboard navigation
for (const m of ['A', 'B']) {

    // Click to select a machine
    $('tab' + m).onclick = () => selectMachine(m);

    // Keyboard navigation for accessibility
    $('tab' + m).onkeydown = e => {

        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();

            selectMachine(
                e.key === 'Home' ? 'A'
                : e.key === 'End' ? 'B'
                : m === 'A' ? 'B' : 'A',
                true
            );
        }
    };
}

// ============================================================
// 4. BUTTON AND CONTROL STATES
// ============================================================

// Disable controls while a spin is in progress
function controls() {

    for (const m of ['A', 'B']) {
        $('spin' + m).disabled = busy;
    }

    $('reset').disabled = busy;
    $('showMethods').disabled = busy || revealed;
}

// ============================================================
// 5. INDIVIDUAL RAFFLE SPINS
// ============================================================

for (const m of ['A', 'B']) {
    $('spin' + m).onclick = async () => {
        // Prevent multiple spins at the same time
        if (busy) return;
        busy = true;
        controls();

        // Generate the actual raffle result
        const n = draw(session.assignment[m]);

        // Get the machine and its three reels
        const machine = $('machine' + m);
        const reels = [...machine.querySelectorAll('.reel')];

        // Start the spin animation
        machine.classList.add('spinning');

        $('outcome' + m).textContent = 'Here we go…';

        let frame = 0;

        // Cosmetic animation never samples or changes the result.
        const timer = reduced ? null : setInterval(() => {
            frame++;
            reels.forEach((r, i) => {
                r.textContent = String((frame + i) % 2);
            });
        }, 70);

        // Wait for the animation to finish
        await new Promise(resolve =>
            setTimeout(resolve, reduced ? 40 : 1100)
        );

        clearInterval(timer);

        machine.classList.remove('spinning');

        // Convert the result into a 3-bit binary number
        const bits = n.toString(2).padStart(3, '0');

        // Display the final result on the reels
        bits.split('').forEach((bit, i) => {
            reels[i].textContent = bit;
        });

        // Update the spin count
        counts[m]++;

        // Save this spin in the session history
        session.draws.push({
            machine: m,
            index: n,
            outcome: outcomes[n],
            at: new Date().toISOString(),
            afterReveal: revealed
        });

        // Display the winning outcome
        $('outcome' + m).textContent = outcomes[n];

        // Update the selected machine's spin counter
        $('count' + m).textContent =
            `${counts[m]} ${counts[m] === 1 ? 'spin' : 'spins'} so far · ${bits}`;

        // Update the overall progress
        $('progress').textContent =
            `A: ${counts.A} ${counts.A === 1 ? 'spin' : 'spins'} · ` +
            `B: ${counts.B} ${counts.B === 1 ? 'spin' : 'spins'}`;

        // Allow another spin
        busy = false;
        controls();
    };
}


// ============================================================
// 6. REVEAL THE RAFFLE METHODS
// ============================================================

$('showMethods').onclick = () => {

    // Prevent revealing while busy or already revealed
    if (busy || revealed) return;

    revealed = true;

    // Record when the methods were revealed
    session.revealedAt = new Date().toISOString();

    // Convert method names into readable labels
    const label = m =>
        session.assignment[m] === 'quantum'
            ? 'Simulated quantum measurement'
            : 'Classical PRNG';

    // Display the machine-to-method mapping
    $('mapping').textContent =
        `Machine A: ${label('A')}. Machine B: ${label('B')}.`;

    // Update each machine's method label
    for (const m of ['A', 'B']) {
        $('method' + m).textContent = label(m);
    }

    // Show the explanation and experiment sections
    $('reveal').hidden = false;
    $('lab').hidden = false;

    // Enable session export
    $('exportSession').disabled = false;

    // Update the reveal button
    $('showMethods').textContent = 'Methods revealed';

    controls();

    // Scroll to the explanation
    $('reveal').scrollIntoView({
        behavior: reduced ? 'instant' : 'smooth'
    });
};


// ============================================================
// 7. FILE DOWNLOAD HELPER
// ============================================================

// Download generated content as a file
function download(name, content, type) {

    const url = URL.createObjectURL(
        new Blob([content], { type })
    );

    const a = document.createElement('a');

    a.href = url;
    a.download = name;
    a.click();

    // Clean up the temporary download URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================
// 8. EXPORT THE CURRENT SESSION
// ============================================================

$('exportSession').onclick = () => {

    download(
        `raffle-${session.id}.json`,
        JSON.stringify(session, null, 2),
        'application/json'
    );
};

// ============================================================
// 9. RUN BULK RAFFLE TRIALS
// ============================================================

$('run').onclick = () => {

    // Read and validate the number of trials
    const input = $('trials');

    if (!input.reportValidity()) return;

    const n = Number(input.value);

    if (!Number.isInteger(n) || n < 8 || n > 100000) {
        return;
    }
    // Create a new batch of raffle trials
    const batch = {
        id: session.bulk.length + 1,
        at: new Date().toISOString(),
        n,

        values: {
            A: [],
            B: []
        }
    };
    // Generate results for both machines
    for (const m of ['A', 'B']) {

        for (let i = 0; i < n; i++) {
            batch.values[m].push(
                draw(session.assignment[m])
            );
        }
    }

    // Save the batch to the session
    session.bulk.push(batch);

    // Calculate outcome frequencies
    const a = frequencies(batch.values.A);
    const b = frequencies(batch.values.B);

    // Display the results in the table
    $('results').innerHTML = outcomes.map((o, i) => `
        <tr>
            <td>${i.toString(2).padStart(3, '0')} · ${o}</td>
            <td>${a[i]}</td>
            <td>${(100 * a[i] / n).toFixed(2)}%</td>
            <td>${b[i]}</td>
            <td>${(100 * b[i] / n).toFixed(2)}%</td>
        </tr>
    `).join('');

    // Display the batch summary
    $('labStatus').textContent =
        `Run ${batch.id}: ${n.toLocaleString()} draws per machine. ` +
        `Expected count per outcome: ${n / 8}.`;

    // Enable exporting trial results
    $('exportTrials').disabled = false;
};


// ============================================================
// 10. EXPORT BULK TRIAL RESULTS AS CSV
// ============================================================

$('exportTrials').onclick = () => {

    // CSV column headers
    const rows = [[
        'session_id',
        'batch',
        'timestamp',
        'machine',
        'method',
        'trial',
        'bits',
        'outcome'
    ]];

    // Collect all saved batch results
    for (const batch of session.bulk) {

        for (const m of ['A', 'B']) {

            batch.values[m].forEach((n, i) => {

                rows.push([
                    session.id,
                    batch.id,
                    batch.at,
                    m,
                    session.assignment[m],
                    i + 1,
                    n.toString(2).padStart(3, '0'),
                    outcomes[n]
                ]);
            });
        }
    }

    // Download results as a CSV file
    download(
        `raffle-trials-${session.id}.csv`,
        csv(rows),
        'text/csv;charset=utf-8'
    );
};

// ============================================================
// 11. RESET THE RAFFLE SESSION
// ============================================================

$('reset').onclick = () => {

    const confirmed = confirm(
        'Start a fresh session? Export first: this will clear the current session.'
    );

    if (confirmed) {
        location.reload();
    }
};

// ============================================================
// 12. WARN BEFORE LEAVING THE PAGE
// ============================================================

window.addEventListener('beforeunload', e => {

    // Warn the user if the session contains individual spins
    if (session.draws.length) {
        e.preventDefault();
        e.returnValue = '';
    }
});
