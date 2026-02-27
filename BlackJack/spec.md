# Blackjack Game — Design Specification

## Overview

A single-player Blackjack game implemented as a single HTML file. The game applies UI/UX best practices and software correctness principles. The player competes against the dealer in a standard casino-style Blackjack game with proper payout rules and edge case handling.

---

## Visual Design

- **Aesthetic**: Classic casino — dark green felt table, gold accents, cream text
- **Font**: Playfair Display (headings/values) + DM Mono (labels/UI text)
- **Color palette**:
  - Table felt: `#1a4a2e` to `#122e1d`
  - Gold accent: `#c9a84c`
  - Card red suits: `#c0392b`
  - Card black suits: `#1a1a1a`
  - Background: deep dark green radial gradient
- **Theme toggle**: Light/dark mode switch available
- **Responsive**: Works on mobile devices (cards and chips scale down at <600px)

---

## Layout

```
┌─────────────────────────────────────┐
│  BLACKJACK        Stats  ThemeToggle│
│  Balance: $1000      Current Bet: $0│
├─────────────────────────────────────┤
│  [TABLE — green felt, rounded]      │
│    DEALER         Score: --         │
│    [ cards ]                        │
│    ─────────────────────────────    │
│    [ status message ]               │
│    ─────────────────────────────    │
│    PLAYER         Score: --         │
│    [ cards ]                        │
├─────────────────────────────────────┤
│  SELECT CHIPS TO BET                │
│  [$5] [$10] [$25] [$50] [$100] [X]  │
│  [DEAL]  [HIT]  [STAND] [DBL] [SPL] │
│  H=hit  S=stand  D=deal/double      │
└─────────────────────────────────────┘
```

---

## Game States

### 1. Betting Phase
- Player selects chips to build a bet
- `DEAL` button is **enabled only when bet > $0**
- `HIT`, `STAND`, `DOUBLE`, `SPLIT` are **disabled**
- Chips and `CLEAR BET` button are active
- Message: *"Place your bet and click Deal to begin."*

### 2. Playing Phase
- `DEAL` button and chips are **disabled**
- `HIT` and `STAND` are **enabled**
- `DOUBLE` is enabled only if:
  - Player has exactly 2 cards
  - Player has sufficient balance to match the bet
- `SPLIT` is enabled only if:
  - Player has exactly 2 cards of equal value
  - Player has not already split
  - Player has sufficient balance for a second bet
- Dealer's second card is **face-down** (hidden)
- Message: *"Your turn. Hit or Stand?"*

### 3. Dealer Phase
- All player actions disabled
- Dealer's hidden card is revealed
- Dealer draws cards automatically with 600ms delay between each
- Dealer must draw until score ≥ 17 (standard casino rule)

### 4. Round Complete
- All outcomes displayed in message area
- Buttons and chips are **disabled** for 3.5 seconds
- After 3.5 seconds, automatically resets to Betting Phase
- If balance reaches $0, reload with $1000

---

## Blackjack Rules

### Card Values
| Card | Value |
|------|-------|
| 2–10 | Face value |
| J, Q, K | 10 |
| Ace | 11 (counts as 1 if hand would bust) |

### Deck
- Uses 2 shuffled standard 52-card decks
- Reshuffled at the start of each round

### Player Actions

| Action | Condition | Effect |
|--------|-----------|--------|
| **Hit** | Playing phase | Draw one card; auto-stand if score = 21 |
| **Stand** | Playing phase | End player turn; trigger dealer play |
| **Double Down** | First 2 cards only, sufficient balance | Deduct extra bet equal to original; draw exactly one card; stand |
| **Split** | First 2 cards of equal value, not already split, sufficient balance | Deduct second bet; split into two hands; deal one card to each |

### Dealer Rules
- Dealer must hit on 16 or less
- Dealer must stand on 17 or more (hard or soft)

### Payouts

| Outcome | Payout |
|---------|--------|
| Player wins (dealer busts or lower score) | 1:1 (win = bet amount) |
| Player Blackjack, dealer no Blackjack | 3:2 (win = 1.5× bet, rounded down) |
| Both Blackjack | Push — bet returned |
| Both same score (non-BJ) | Push — bet returned |
| Player busts | Lose bet |
| Dealer wins | Lose bet |

### Edge Cases
- Player blackjack with dealer blackjack → **push** (bet returned, NOT 1.5x payout)
- Ace always recalculates: counts as 11 until it would cause a bust, then 1
- Split hands are **not eligible** for blackjack payout (treated as normal 21)
- Double down on bust → lose doubled bet

---

## Split Behavior

- When split is triggered:
  - One card from each original pair becomes the start of a new hand
  - One new card is dealt to each hand
  - Second bet equal to original is deducted from balance
- Player plays Hand 1 first, then Hand 2
- Active hand is visually highlighted with a gold border
- After Hand 1 stands or busts, play moves to Hand 2
- After both hands are resolved, dealer plays normally
- Each hand's outcome is evaluated independently against the dealer

---

## UI/UX Requirements

### Button States
- Buttons must accurately reflect the current game phase — no enabled buttons that would cause invalid actions
- After round ends, all action buttons disabled for 3.5s before reset
- Chips disabled during playing and dealer phases

### Bet Display
- Current bet must be visible **before** cards are dealt
- Displayed as `CURRENT BET: $X` near the top of the controls area

### Feedback
- Every game state has a clear status message
- Blackjack wins use a pulsing gold animation
- Win messages: gold styling
- Lose messages: red styling
- Push messages: gray styling

### Statistics Display
- Wins, losses, and current streak shown in the header
- Streak increments positively on wins, negatively on losses, resets to 0 on push

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `H` | Hit |
| `S` | Stand |
| `D` | Deal (betting phase) or Double Down (playing phase) |
| `C` | Clear bet |
| `1` | Add $5 chip |
| `2` | Add $10 chip |
| `3` | Add $25 chip |
| `4` | Add $50 chip |
| `5` | Add $100 chip |

---

## Testing Scenarios

### Required Tests

1. **Player Blackjack, Dealer no Blackjack**
   - Expected: Player wins 1.5× bet
   - Example: Player gets [A♠, K♠], Dealer gets [7♣, 9♦] → Player receives $15 on a $10 bet

2. **Both Player and Dealer Blackjack**
   - Expected: Push — bet returned, no gain or loss
   - Example: Player gets [A♥, Q♦], Dealer gets [A♣, J♠] → $10 bet returned

3. **Player Busts**
   - Expected: Lose full bet immediately, no dealer draw needed

4. **Dealer Busts, Player Stands**
   - Expected: Player wins 1:1

5. **Push (equal non-BJ scores)**
   - Expected: Bet returned

6. **Double Down increases bet and limits to one card**
   - Expected: Bet doubles, exactly one more card dealt, auto-stand

7. **Split creates two independent hands**
   - Expected: Two bets deducted, two hands played separately

8. **Ace recalculation**
   - Expected: [A, 9] = 20; [A, 9, 5] = 15 (Ace counts as 1)

---

## Implementation Notes

- Single HTML file (HTML + CSS + JS, no external dependencies except Google Fonts)
- No build tools or frameworks required
- All game logic in vanilla JavaScript
- No `localStorage` or server-side state — everything in memory per session
- Deck rebuilds and reshuffles at the start of every round
- Balance resets to $1000 if player goes broke

---

## Out of Scope (Not Implemented)

- Insurance (when dealer shows an Ace)
- Multiple simultaneous splits (only one split per round)
- Betting history persistence across page reloads
- Multiplayer
