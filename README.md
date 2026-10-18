# Is This Raffle Fair?

An ICS 651 classroom project about randomness, perceived fairness, and trust. A warm, marquee-inspired browser interface compares two identically styled raffle machines without casino branding, wagering, or prizes. Built with plain HTML, CSS, and JavaScript: no framework, dependencies, accounts, API keys, or build step.

## Run locally

Install Python 3, open a terminal in this folder, and run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use a local server rather than double-clicking index.html because the app uses JavaScript modules. Internet access is not required once you have the files. Node.js 18+ is optional for tests:

```sh
npm test
```

## Participant flow

1. Start a fresh participant session. The app randomly assigns classical and simulated quantum methods to A/B with equal probability.
2. Make exactly three draws on each machine, in either order. Both use the same timing, visual treatment, and outcome mapping.
3. Rate perceived fairness and trust for each machine on a 1–5 scale; choose A, B, or no preference.
4. Save the initial survey to reveal the assignment and neutral method explanations.
5. Rate both again. Export the anonymous session JSON, which includes the assignment, timestamps, both surveys, six participant draws, and any bulk runs.
6. Optionally run 8–100,000 trials per machine. View counts and percentages; export every recorded bulk run as a CSV with one row per draw. The table shows only the latest run. Re-export the session JSON after bulk runs if you want them included.
7. Export before choosing New participant. This resets and randomizes the assignment again.

Everything is held in tab memory. Closing or refreshing loses data; the browser may show a leave-page warning. There is no backend, automatic collection, local storage, or analytics. An export is an intentional local download. Do not enter names or identifying details. To collect multiple participants, save each completed JSON separately; the app does not aggregate participants automatically. Keep collected responses out of the public repository.

## Randomness and outcome mapping

| Bits | Outcome | Ideal probability |
| --- | --- | --- |
| 000 | Player 1 | 12.5% |
| 001 | Player 2 | 12.5% |
| 010 | Player 3 | 12.5% |
| 011 | Player 4 | 12.5% |
| 100 | Player 5 | 12.5% |
| 101 | Player 6 | 12.5% |
| 110 | Player 7 | 12.5% |
| 111 | No Winner | 12.5% |

No Winner is a valid result, not a reroll. Each trial is independent under the ideal random-source assumption; previous winners remain eligible.

**Classical PRNG:** `Math.floor(Math.random() * 8)` maps a software pseudorandom value onto eight equal intervals.

**Simulated quantum measurement:** the conceptual circuit is `|000> → H ⊗ H ⊗ H → measurement`. Each prepared qubit has amplitude magnitude `1/√2` for each basis state and a measurement probability of 1/2. Three independent bit samples give eight outcomes with ideal probability `(1/2)^3 = 1/8`. The app directly samples those probabilities using three calls to `Math.random()`. It is a distribution-level simulation, not a general state-vector circuit engine. Bits are read left to right as most significant to least significant.

The reel animation is cosmetic. A result is sampled once before it starts; the animation never changes that result. See IBM's primary teaching reference on [superposition and measurement](https://quantum.cloud.ibm.com/learning/en/modules/quantum-mechanics/superposition-with-qiskit).

## What this experiment can say

Primary question: does learning the method change participants' reported trust or fairness ratings? Compute within-person after-minus-before differences for each method by using the recorded A/B assignment, and summarize preferences before and after reveal. Report sample size, rating distributions, and uncertainty. These ratings are ordinal and a small convenience sample is exploratory. Choose your analysis plan and participant count before collecting data.

Bulk trials illustrate sampling variability. Expected count is `N/8` for each outcome; an exactly flat histogram is not required for fairness. Keep bulk simulation results separate from participant observations. An optional chi-square goodness-of-fit analysis has 7 degrees of freedom and should use sufficiently large expected counts (typically at least 5 per bin). A non-significant test does not prove randomness or fairness, and a deviation does not identify its cause.

### Accuracy and study limitations

- Both modes use the browser's **same software PRNG**, whose algorithm and seed are browser-controlled. There is no reproducible seed or cryptographic guarantee. Equal probability is the ideal mathematical target, not a hardware-certified claim.
- No real quantum randomness is generated. This cannot establish that quantum randomness is more fair, unpredictable, or trustworthy than classical randomness.
- Real hardware would require a separate integration, measurement records, noise/readout-bias characterization, and attention to device access and provenance. Hardware results may not be exactly uniform.
- A/B assignment is concealed in the ordinary interface until survey submission, but static client code and memory are inspectable. This is an informal classroom blind, not secure concealment or a double-blind research system.
- Assignment randomization balances labels only in expectation. Participants choose drawing order; order effects, short-run luck, prior beliefs, explanation wording, and small samples may influence answers.
- Refreshing can restart a session. There is no identity checking, duplicate prevention, server validation, tamper evidence, or central persistence. Use supervised sessions for consistent collection.
- All session data includes method assignment after export; exports unlock only after the post-reveal survey. The app does not support real prize drawings or regulated use.

## Files

- `index.html`: interface and experiment instructions.
- `style.css`: responsive machine design and reduced-motion support.
- `random.js`: outcome samplers and export helpers.
- `app.js`: session flow, surveys, animation, trial batches, exports.
- `tests/random.test.js`: deterministic checks for mapping, thresholds, frequencies, and CSV escaping.

## Publish to GitHub

The supplied folder is ready to become a repository. If it already contains a Git commit, skip the first three commands. Install Git and GitHub CLI, then run from this folder:

```sh
git init -b main
git add .
git commit -m "Build ICS 651 raffle experiment"
gh auth login -h github.com
gh repo create is-this-raffle-fair --public --source=. --remote=origin --push
```

Choose `--private` instead of `--public` if desired. If that repository name already exists, choose another unused name. Git may ask you to configure your name/email before committing; use your own details or your GitHub no-reply address.

To host the app with GitHub Pages, open the repository's **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/ (root)**, then save. GitHub shows the resulting site URL on that page. All app paths are relative, so project Pages hosting works. A private repository's Pages availability depends on your GitHub plan; review site visibility before enabling it.

Alternatively, create an empty repository at https://github.com/new, upload the app files and tests folder (not exported participant data), and enable Pages as above. No build workflow or secrets are needed.
