# Frontend GitHub Workflows

Frontend workflow definitions are kept here so the frontend project has its own CI/CD folder.

GitHub Actions only discovers active workflows from the repository root `.github/workflows` directory. For that reason, the repository root still contains active `frontend-*` workflow files that run these same frontend build jobs.

When backend CI/CD is added later, add it as separate `backend-*` workflow files in the root `.github/workflows` directory.
