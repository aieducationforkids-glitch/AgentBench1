# Monetization, Pricing, & Operations

## 1. Credit & Pricing Model
The platform operates on a pay-as-you-go credit system. Assuming an average complex agent run (100 tasks) costs ~$2 in cloud compute, 1 credit equates to approximately $0.08 of compute.

| Plan | Price | Credits | Description |
| :--- | :--- | :--- | :--- |
| **Free Tier** | $0 | 10 free runs/mo | Limited runs for new users to test the platform. |
| **Pay-as-you-go** | $5 | 25 runs | Base pack, ideal for small tests and hobbyists. |
| **Pro (Monthly)** | $20/mo | 150 runs | Lower cost-per-run for frequent iterators/small teams. |
| **Enterprise** | Custom | Custom | Dedicated support, volume discounts, private benchmarks. |

**Estimated Cost Breakdown (Platform Overhead):**
* Compute (GPU/VMs): 50%
* Data Storage & Bandwidth: 10%
* Dev/Ops & Maintenance: 25%
* Business/Support/Overhead: 15%

## 2. Platform Operations & Observability
* **Monitoring:** Track platform health and worker node loads using Prometheus and Grafana.
* **Logging:** All evaluation runs must be logged immutably for audits and reproducibility. Alerting configured for hung agent processes or API failures.
* **CI/CD:** Automated testing for the evaluation engine. Infrastructure managed via Terraform.

## 3. Prioritized Next Steps for MVP
1.  **Define Core Benchmarks (MUST):** Assemble the first 40 healthcare tasks (20 payer, 20 provider). Finalize the scoring rubric and LLM judge prompts.
2.  **Build Submission & Auth (MUST):** Implement Auth0 signup, 2FA, and the basic web UI/API for Docker/ZIP uploads.
3.  **Implement Eval Engine (MUST):** Build the K8s runner that executes the agent against the tasks and computes pass/fail scores.
4.  **Set Up Leaderboards (MUST):** Design the database schema and public UI for the Healthcare industry leaderboard.
5.  **Integrate Payments (SHOULD):** Connect Stripe to manage free trial credits and execute credit deductions upon job start.
6.  **Develop Feedback UI (SHOULD):** Build the dashboard for developers to review execution logs, errors, and success metrics post-run.
