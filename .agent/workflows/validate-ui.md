---
description: Automated UI/UX Validation via Browser Subagent
---

# Validate UI Workflow

Run this workflow anytime you want the agent to automatically test the UI without manual intervention.

1. Ensure the development server is running (`npm run dev`)
// turbo
2. Verify the server is responsive with a quick curl: `curl -I http://localhost:5173 2>/dev/null | head -n 1`
3. If the server is not running, stop the workflow and run `/localhost`.
4. Ask the agent to use its `browser_subagent` tool to navigate to the target page (e.g. `http://localhost:5173/admin` or `http://localhost:5173/visual`).
5. The agent should be instructed to:
   - Wait for the page to fully load.
   - Perform clicks on specific buttons to test interactions (like the Save Layout button or Login form).
   - Take a screenshot of the final state.
   - Check the console logs for any errors.
6. Once the subagent finishes, the agent must report back with a summary of the UI test and whether it passed or failed.
