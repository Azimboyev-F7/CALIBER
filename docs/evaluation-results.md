# CALIBER scoring evaluation

Generated 2026-11-07 from the local engine. All profiles are synthetic.

## 1. Repeatability

The same profile was run 3 times. Output identical in every run, including ranges: **yes**.

## 2. Sensitivity (one change at a time)

Baseline: GPA 3.8, SAT 1480. "Schools" compares the 10 recommended schools with the baseline's. Ranges are the estimate for the first school in each tier (Harvard University / Syracuse University / Arizona State University (ASU)).

| Input | Schools | Reach #1 | Target #1 | Safety #1 | Mean range midpoint |
|---|---|---|---|---|---|
| GPA 3.5 (SAT 1480) | same | 2–4% | 68–82% | 93–97% | 44.9 |
| GPA 3.8 (SAT 1480) | same | 2–4% | 68–82% | 93–97% | 63.0 |
| GPA 4.0 (SAT 1480) | same | 2–4% | 68–82% | 93–97% | 63.0 |
| SAT 1200 (GPA 3.8) | same | 2–4% | 22–38% | 77–92% | 44.6 |
| SAT 1350 (GPA 3.8) | same | 2–4% | 46–61% | 77–92% | 55.0 |
| SAT 1480 (GPA 3.8) | same | 2–4% | 68–82% | 93–97% | 63.0 |

## 3. Labelled test cases (synthetic)

| Case | Schools | Schools with no estimate | Reach #1 | Target #1 | Safety #1 |
|---|---|---|---|---|---|
| Strong (GPA 4.0, SAT 1560) | same as baseline | 0 | 4–19% | 68–82% | 93–97% |
| Average (GPA 3.3, SAT 1150) | same as baseline | 0 | 2–4% | 22–38% | 37–63% |
| Low (GPA 2.6, SAT 950) | same as baseline | 0 | 2–4% | 22–38% | 37–63% |
| No SAT (GPA 3.8) | same as baseline | 10 | none | none | none |
| No GPA (SAT 1480) | same as baseline | 10 | none | none | none |
| GPA 4.8 on a 5.0 scale (= 3.84 on 4.0), SAT 1480 | same as baseline | 0 | 2–4% | 68–82% | 93–97% |
| GPA 4.0 on a 5.0 scale (= 3.2 on 4.0), SAT 1480 | same as baseline | 0 | 2–4% | 22–38% | 37–63% |
| No activities or honors | same as baseline | 0 | 1–3% | 67–81% | 92–96% |
| International: UK | different | 0 | 13–17% | 29–39% | 74–99% |
| International: Canada | different | 0 | 38–50% | 46–62% | 56–76% |

## 4. What the lists depend on

Reach/Target/Safety membership is set by each school's official acceptance rate (below 20%, 20–55%, above 55%) and the student's country. In section 2 the school lists never change when GPA or SAT change; only the estimated range changes. Local dataset size by region: us 72, uk 8, canada 6, korea 6, germany 6, china 6.

## Baseline lists

- **Reach:** Harvard University, Stanford University
- **Target:** Syracuse University, Ohio State University, Purdue University, University of Wisconsin-Madison
- **Safety:** Arizona State University (ASU), University of Colorado Boulder, Michigan State University, George Mason University

