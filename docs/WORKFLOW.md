# Team workflow

- **Planning & tickets:** Jira project **FixItApp** (`SCRUM`)
- **Code & CI/CD:** GitHub [Fix-It-Repair-website](https://github.com/Wesh2003/Fix-It-Repair-website)
- **Design:** [Figma — Untitled](https://www.figma.com/design/2x1GjFyLNJxuZpnbYdvKgr/Untitled?node-id=0-1&m=dev) (see [`DESIGN.md`](DESIGN.md))

Suggested PR flow: Jira ticket → branch → PR → review → merge to `main`.

## Jira integration

- **Instance:** Jira Cloud (wendomuriithi.atlassian.net)
- **Repo host:** GitHub
- **Enforcement:** CI check (GitHub Actions) validates branch names, PR titles, and commit messages for a Jira issue key.

Steps to finish setup:

1. Create a Jira project (e.g. `FixItApp`) and note its project key (e.g. `FIXIT`).
2. Create an API token for automation (Jira Cloud: Atlassian account settings → Security → API tokens).
3. (Optional) Install the "Jira Cloud" app from the GitHub Marketplace to get richer linking and smart commits.
4. Add any credentials to your GitHub repository `Secrets` (Repository Settings → Secrets):
	- `JIRA_API_TOKEN` — the token you created
	- `JIRA_USER_EMAIL` — Atlassian account email used to create the token
	- `JIRA_PROJECT_KEY` — optional; if set the CI will require keys to start with this prefix

I added a CI workflow at `.github/workflows/validate-jira-keys.yml` that enforces the issue-key requirement. Enable Actions for the repo and adjust `JIRA_PROJECT_KEY` as needed.
