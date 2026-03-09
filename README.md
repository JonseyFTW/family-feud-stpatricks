# Family Feud - St. Patrick's Day Edition

A real-time Family Feud web game with a St. Patrick's Day theme. Features a Host Control Panel and a separate Game Display Board that sync in real-time across browser tabs.

## Quick Start

### Prerequisites

- Node.js 18+ (recommend 20+)

### Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

### 1. Lobby (Home Page)

- Enter team names and host name
- Click **"Open Display Board"** to open the game board in a new tab/window (project this for players to see)
- Click **"Start Game"** to open the Host Control Panel

### 2. Host Control Panel (`/host`)

The host controls the entire game from this page. It stays on the host's device (laptop/phone) and is not shown to players.

**Starting a Round:**
- Select a question from the list to begin a round
- The round starts in **Face-Off** mode

**Face-Off:**
- Two players (one from each team) compete to answer first
- Click **Team Shamrock** or **Team Leprechaun** to indicate who buzzed in
- Reveal the top answer — if the buzzing team got it, they choose to play or pass

**Play Phase:**
- Click answer buttons to reveal correct answers
- Click **"Wrong Answer (Strike)"** for incorrect guesses
- After 3 strikes, the round moves to **Steal**

**Steal Phase:**
- The opposing team gets one chance to steal
- **"Steal Successful"** — they get all the round's points
- **"Steal Failed"** — points go to the playing team
- **"Reveal Remaining"** shows all unguessed answers

**Score Adjustments:**
- Use the +1, -1, +10, -10 buttons next to each team name to manually adjust scores at any time

**Fast Money:**
- Click **"Fast Money"** to start a Fast Money round
- Enter answers and points for two players
- Use the timer and reveal controls

**End Game:**
- Click **"End Game"** to show the final scores and winner on the display board

### 3. Game Display Board (`/board`)

This is what players see. Open it in a separate browser tab/window and project it on a TV or screen.

- Shows the title screen while waiting
- Displays the answer board with flip animations during rounds
- Shows strike animations (big red X) on wrong answers
- Displays celebrations and confetti when appropriate
- Shows final scores at game over

## Managing Questions

### Built-in Questions

The game comes with 15 St. Patrick's Day themed questions pre-loaded.

### Adding Questions Manually

1. Click **"Edit Qs"** in the top-right of the Host Panel
2. Click **"+ Add New"**
3. Type the survey question
4. Add answers with point values (up to 8 answers per question)
5. Click **"Add Question"**, then **"Save All"**

### Importing Questions from CSV

You can bulk-import questions using a CSV file.

**CSV Format:**
```
Question, Answer1, Points1, Answer2, Points2, Answer3, Points3, Answer4, Points4
"Name something you bring to a picnic", "Blanket", 35, "Food", 28, "Drinks", 18, "Sunscreen", 10
"Name a popular board game", "Monopoly", 40, "Scrabble", 22, "Chess", 15, "Clue", 12
```

- First row is auto-detected as a header and skipped (if it starts with "Question")
- Each row: question text, then alternating answer/points pairs
- Supports 1-8 answers per question
- Quotes around text fields are optional (required if text contains commas)
- Answers are automatically sorted by points (highest first)

**To upload:**
1. Click **"Upload CSV"** in the Question Editor header, OR
2. Click **"Upload CSV"** in the host panel action bar
3. Select your `.csv` or `.txt` file

### Editing & Deleting Questions

- Click **"Edit"** next to any question in the Question Editor to modify it
- Click **"Del"** to remove a question
- Click **"Save All"** to persist changes

## Sound Effects

The host panel has sound effect buttons at the bottom:

- **Ding** — correct answer reveal
- **Buzzer** — wrong answer
- **Applause** — crowd applause
- **Intro** — theme music intro
- **Confetti** — triggers confetti on the display board

Sounds also play automatically on the display board when answers are revealed or strikes occur.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** with custom theme
- **BroadcastChannel API** for real-time cross-tab sync
- **Web Audio API** for synthesized sound effects
- **localStorage** for game state persistence

## Project Structure

```
src/
  app/
    page.tsx          # Lobby/setup page
    host/page.tsx     # Host control panel
    board/page.tsx    # Game display board
    layout.tsx        # Root layout
    globals.css       # Global styles & animations
  components/
    AnswerBoard.tsx   # Flip-card answer board
    ScoreBar.tsx      # Team score display
    StrikeDisplay.tsx # Strike X animation overlay
    FastMoneyBoard.tsx# Fast Money round display
    Celebration.tsx   # Confetti particle effects
    QuestionEditor.tsx# Question add/edit/delete/import modal
  lib/
    types.ts          # TypeScript interfaces
    gameState.ts      # Game store with BroadcastChannel sync
    questions.ts      # Pre-loaded questions
    sounds.ts         # Web Audio API sound effects
    csvParser.ts      # CSV question import parser
```

## Tips for Hosting

- Use two browser windows: one for the host panel, one for the display board
- The display board works best full-screened on a TV or projector
- Both windows must be in the **same browser** (BroadcastChannel requires same origin)
- The game state persists in localStorage, so refreshing won't lose progress
- Adjust scores manually if needed using the +/- buttons
