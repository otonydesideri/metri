# Finding Format

Each reviewer /accept calls (`reviewer-contract`, `reviewer-patterns`, `reviewer-ux`, `reviewer-risk` and
`consumer-tester`) writes every finding with these four fields, on top of what its brief asks; /accept presents
them unchanged.

- **Evidence**: the quoted line or lines that motivate it, with `file:line` (for `reviewer-ux`, the screenshot path;
  for `consumer-tester`, the steps taken and what the screen or the interface answered).
- **Confidence**: `N/10`. 9–10: read in the code or reproduced; 7–8: a strong match; 5–6: may be a false positive,
  and the finding says what confirms it. A finding whose evidence can't be quoted gets 4 at most.
- **Class**: `mecânico` when one fix is plainly right and changes nothing a user, a consumer or the contract sees (a
  missing test for a written criterion, a missing header line, a state the rule names); `decisão` otherwise
  (behaviour, scope, taste, security, data).
- **Group**: Corrigir agora, Virar T or Aceitar como está, with the reviewer's recommendation.

Findings with confidence below 5 go to an "Apêndice" at the end of the report, one line each.

A reviewer that couldn't do its work (no tool, no input, an error) reports **não coberto** and why, never zero
findings.
