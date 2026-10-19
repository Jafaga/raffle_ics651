# Is This Raffle Fair?

[![Website status](https://img.shields.io/website?url=https%3A%2F%2Fis-this-raffle-fair.vercel.app&label=live%20website&up_message=online&down_message=offline&up_color=brightgreen&down_color=red)](https://is-this-raffle-fair.vercel.app/)

An ICS 651 classroom project about randomness, perceived fairness, and trust. A friendly, colorful browser interface compares two identically styled raffle machines without casino branding, wagering, or prizes. Built with plain HTML, CSS, and JavaScript: no framework, dependencies, accounts, API keys, or build step.

## Run locally

Install Python 3, open a terminal in this folder, and run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use a local server rather than double-clicking index.html because the app uses JavaScript modules. Internet access is not required once you have the files. Node.js 18+ is optional for tests:

```sh
npm test
```

## How to use it

1. Switch between Machine A and Machine B using the tabs. Keyboard users can use Left/Right arrows or Home/End on the tabs.
2. Spin as many times as you like. Each machine retains its result and count when switching tabs, including during an animation.
3. Select **Reveal the methods** whenever you are ready. This reveals the randomized assignment and unlocks bulk trials and exports. You can continue spinning afterward.
4. Run 8–100,000 trials per machine and export all batches as CSV. The table shows the latest batch. Export session JSON for assignments, timestamps, individual draws, reveal time, and bulk results. Each draw records whether it occurred after reveal.
5. Export before choosing **Start fresh**. Closing or refreshing also clears the session.

There are no surveys, accounts, analytics, or automatic response collection. Everything stays in browser memory until downloaded. No names are collected. Keep exported data out of the repository.

## Live website

https://is-this-raffle-fair.vercel.app

Source: https://github.com/Jafaga/raffle_ics651

Vercel project: `is-this-raffle-fair`, in Justine Afaga’s projects. The static site is deployed through the connected Vercel integration. GitHub automatic deployments are not configured; changes must be redeployed. `vercel.json` specifies no framework or build step.

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

This is an exploratory randomness demonstration. The app does not collect trust or fairness ratings; a study of perceived trust would require a separate data-collection method.

Bulk trials illustrate sampling variability. Expected count is `N/8` for each outcome; an exactly flat histogram is not required for fairness. Keep bulk simulation results separate from participant observations. An optional chi-square goodness-of-fit analysis has 7 degrees of freedom and should use sufficiently large expected counts (typically at least 5 per bin). A non-significant test does not prove randomness or fairness, and a deviation does not identify its cause.

### Accuracy and study limitations

- Both modes use the browser's **same software PRNG**, whose algorithm and seed are browser-controlled. There is no reproducible seed or cryptographic guarantee. Equal probability is the ideal mathematical target, not a hardware-certified claim.
- No real quantum randomness is generated. This cannot establish that quantum randomness is more fair, unpredictable, or trustworthy than classical randomness.
- Real hardware would require a separate integration, measurement records, noise/readout-bias characterization, and attention to device access and provenance. Hardware results may not be exactly uniform.
- A/B assignment is concealed in the ordinary interface until the user chooses to reveal the methods, but static client code and memory are inspectable. This is an informal classroom blind, not secure concealment or a double-blind research system.
- Assignment randomization balances labels only in expectation. Participants choose drawing order; order effects, short-run luck, prior beliefs, explanation wording, and small samples may influence answers.
- Refreshing can restart a session. There is no identity checking, duplicate prevention, server validation, tamper evidence, or central persistence. Use supervised sessions for consistent collection.
- All session data includes method assignment after export; exports unlock after the methods are revealed. The app does not support real prize drawings or regulated use.

## Files

- `index.html`: interface and experiment instructions.
- `style.css`: responsive machine design and reduced-motion support.
- `random.js`: outcome samplers and export helpers.
- `app.js`: session flow, accessible tabs, animation, trial batches, exports.
- `tests/random.test.js`: deterministic checks for mapping, thresholds, frequencies, and CSV escaping.

## Deployment

Use the existing Vercel project `is-this-raffle-fair`. Deploy the four public app files (`index.html`, `style.css`, `app.js`, `random.js`) with `vercel.json`. Do not upload participant exports. To use the Vercel CLI, sign in, link this folder to the existing project in the correct account, and run `vercel --prod`.

## Design

An original friendly ticket character, bright green buttons, blue reel cabinet, rounded shapes, and responsive layouts. Inspired by approachable learning apps; no Duolingo branding or assets are used. Both machines use identical styling and timing. Reduced-motion preferences are respected.

## Website status

The README badge checks whether the public website responds. Click it to open the app. This is an availability indicator, not a guarantee that every feature works or that the newest commit has deployed. Shields.io and GitHub cache badge images, so a change may take several minutes to appear. Deployment details are available in the [Vercel dashboard](https://vercel.com/justine-afagas-projects/is-this-raffle-fair).
