# System Architecture & Technical Stack

## 1. High-Level Architecture
The system is divided into three main layers: User Layer, Core System, and Infrastructure. 

```mermaid
graph LR
  subgraph UserLayer
    UI[User Web UI / CLI]
    API[API Gateway/Auth Service]
    Payments[Payment Service (Stripe)]
  end
  subgraph CoreSystem
    DB[(User/Agent DB)]
    Storage[(Artifact Storage)]
    Queue[Job Queue (e.g. RabbitMQ)]
    Workers[Evaluation Workers (K8s Jobs)]
    Benchmarks[(Benchmark Suite)]
    Results[(Result DB)]
    Auth[Auth Service]
  end
  subgraph Infra
    CI/CD[CI/CD Pipeline]
    Monitoring[Monitoring (Prometheus/Grafana)]
    Identity[Identity Provider (OAuth/SSO)]
    Logs[Logging/Observability (ClickHouse, S3)]
  end

  UI --> API
  API --> Auth
  UI --> Identity
  Auth --> DB
  API --> DB
  API --> Payments
  Payments --> DB
  UI --submit agent--> Storage
  API --submit request--> Queue
  Queue --> Workers
  Workers --> Benchmarks
  Workers --> Storage
  Workers --> Results
  Results --> DB
  Results --> UI
  DB --> API
  DB --> Monitoring
  Workers --> Logs
  CI/CD --> Workers
  Monitoring --> API
```

## 2. Tech Stack & Integrations
* **Agent Frameworks:** Framework-agnostic. Support for LangChain, OpenAI Function Calling, Auto-GPT, BabyAGI via Docker.
* **Containerization & Orchestration:** Docker for agents; Kubernetes (EKS/GKE/AKS) or AWS ECS for parallel task execution. Message queue (RabbitMQ/SQS) for job dispatch.
* **Storage:** Object storage (S3/GCS) for artifacts/logs; Relational DB (PostgreSQL) for user/score metadata; ClickHouse/Elasticsearch for high-volume logs.
* **Observability:** Prometheus/Grafana for infra monitoring. Laminar/ClickHouse for trace and eval metrics.
* **Identity & Payments:** Auth0/AWS Cognito (Auth), Twilio/SendGrid (Verification), Stripe (Payments).
* **Benchmarking Harness:** Custom runner with LLM judge (Claude/GPT) or integration with existing scaffolds like HAL.

## 3. Non-Functional Requirements
* **Scalability:** Horizontally scale with usage spikes. Hundreds of parallel tasks per agent evaluation using auto-scaling K8s job workers.
* **Availability:** 99.9% uptime target for eval service. Multi-AZ deployment. Graceful degradation for individual failed benchmark tasks.
* **Performance/Latency:** Near-real-time log streaming to user dashboards. UI remains responsive while backend tasks take minutes/hours. Use incremental cache updates for leaderboards.
* **Cost-Efficiency:** Spot instances for batch runs. Estimate compute costs and deduct credits accurately to maintain margins.
* **Reproducibility:** Lock agent Docker image tags, benchmark versions, and random seeds to ensure deterministic, repeatable evaluations.
