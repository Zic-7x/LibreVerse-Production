# Infrastructure

Deployment, environments, and platform configuration.

## Layout

| Path | Purpose |
|------|---------|
| `terraform/` | IaC modules and per-environment configs |
| `kubernetes/` | Kustomize base and environment overlays |
| `ci/` | Pipeline definitions (GitHub Actions, etc.) |
| `scripts/` | Deploy, bootstrap, and ops automation |

## Environments

Terraform and Kubernetes overlays are split by environment:

- `dev`
- `staging`
- `production`

Keep secrets out of version control; use environment-specific secret stores.
