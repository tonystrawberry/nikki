---
title: "EC2 High Availability and Scalability"
date: "2026-03-21"
excerpt: "Consolidated AWS notes on EC2 scalability, high availability, ELB/ALB/NLB/GWLB, TLS, health/metrics, target-group tuning, ASG scaling, warm pools, lifecycle hooks, and scaling plans."
author: "Tony Duong"
category: "note"
tags: ["aws", "ec2", "scalability", "high-availability", "load-balancer", "elb", "alb", "nlb", "gwlb", "zcloudops", "cloud"]
---

## Overview

This post consolidates AWS CloudOps topics into one learning path: **scalability**, **high availability**, **ELB fundamentals**, **ALB internals + advanced rules**, and **hands-on ALB/NLB demos** with EC2.

## 1) Scalability vs High Availability

### Scalability

Scalability means your system can handle more load by adapting capacity.

- **Vertical scaling (scale up/down):** increase instance size (e.g. `t2.micro` -> `t2.large`)
- **Horizontal scaling (scale out/in):** increase or decrease number of instances

### High Availability (HA)

High availability means running across at least two AZs (or data centers) so one failure does not take down the app.

- **Passive HA:** active + standby (e.g. RDS Multi-AZ)
- **Active HA:** multiple active instances serving traffic

### Practical framing

- Vertical scaling is common for non-distributed systems (e.g. databases) but has hardware limits.
- Horizontal scaling is common for distributed web apps and modern cloud workloads.
- HA is usually paired with horizontal scaling and multi-AZ deployment.

## 2) Elastic Load Balancer (ELB) Fundamentals

A load balancer distributes incoming traffic across backend instances while exposing a single endpoint.

### Why use a load balancer

- One public entrypoint for users
- Health checks to avoid unhealthy targets
- SSL termination
- Sticky sessions (cookies)
- High availability across zones
- Cleaner separation of public and private traffic

### ELB is managed by AWS

AWS handles patching, maintenance, and high availability. ELB integrates with EC2, Auto Scaling Groups, ECS, ACM, CloudWatch, Route 53, WAF, and Global Accelerator.

### Load balancer types

| Type | Layer / protocols | Typical use |
|------|-------------------|-------------|
| **ALB** | Layer 7, HTTP/HTTPS/WebSocket | Web apps and HTTP routing |
| **NLB** | Layer 4, TCP/TLS/UDP | Ultra-high performance, low latency |
| **GWLB** | Network layer (IP) | Security appliances / traffic inspection |
| **CLB** | Legacy | Deprecated for new workloads |

## 3) ALB Deep Dive

The **Application Load Balancer** is an HTTP (layer 7) load balancer with rich routing and target options.

### ALB capabilities

- HTTP/2 and WebSocket support
- HTTP -> HTTPS redirects
- Rule-based routing by:
  - path (`/users`, `/posts`)
  - host (`api.example.com`, `app.example.com`)
  - query string (e.g. `?Platform=Mobile`)
  - headers

### Target groups

ALB routes requests to target groups. Supported targets:

- EC2 instances
- ECS tasks
- Lambda functions
- Private IP addresses (including hybrid/on-prem scenarios)

Health checks are configured **per target group**.

### Client IP forwarding headers

Because ALB terminates connections, backend EC2 sees ALB's private IP by default. Original client context is passed via:

- `X-Forwarded-For`
- `X-Forwarded-Port`
- `X-Forwarded-Proto`

Your app should read these when it needs original client details.

### Security group pattern

- ALB security group: allow inbound 80/443 from `0.0.0.0/0` (public ALB)
- EC2 security group: allow inbound app traffic **from ALB security group only**

This ensures instances are reachable only through the load balancer path.

## 4) Hands-On: Launch EC2 + Build an ALB

### Step 1: Launch two EC2 instances

- AMI: Amazon Linux 2
- Type: `t2.micro`
- Key pair: none (optional EC2 Instance Connect)
- Security group: allow HTTP (80) and SSH (22)
- User data: simple web app returning "hello world" + instance identity

Validate each instance by opening its public IPv4 URL.

### Step 2: Create ALB

- Name: `DemoALB`
- Scheme: internet-facing
- IP type: IPv4
- Network mapping: multiple AZs
- ALB SG: allow inbound HTTP 80 from anywhere

### Step 3: Create target group and listener

- Target group: instances, HTTP:80
- Register both EC2 instances
- Listener: ALB HTTP:80 -> target group

### Step 4: Verify load balancing

Open ALB DNS name and refresh repeatedly: responses alternate between instance IDs (round-robin behavior).

### Step 5: Verify health check failover

- Stop one instance
- Wait for target health to turn unhealthy
- ALB sends traffic only to healthy instance
- Start stopped instance again
- After health checks pass, ALB resumes traffic to both

## 5) Advanced ALB Concepts

### Tighten network security: EC2 only behind ALB

A common hardening step is preventing direct public access to EC2 instances and only allowing traffic through the ALB.

- Before hardening: EC2 can be reached directly by public IP and via ALB
- After hardening:
  - Remove EC2 inbound HTTP rule from `0.0.0.0/0`
  - Add EC2 inbound HTTP rule with **source = ALB security group**
- Result:
  - Direct EC2 public-IP access times out
  - ALB endpoint still works because ALB SG is explicitly allowed

### ALB listener rules (beyond default forwarding)

ALB listeners support rule-based request handling with **conditions + actions + priority**.

- Example condition: path pattern `/error`
- Example action: return fixed response
  - status code: `404`
  - body: `"not found, custom error"`
- Priority determines which rule wins when multiple rules match (lower number = higher priority)

This enables routing and behavior control without changing backend code.

## 6) Network Load Balancer (NLB) Theory

The **Network Load Balancer** operates at **Layer 4** and is designed for TCP/UDP workloads.

### When to choose NLB

- Need **TCP/UDP** (or TLS over TCP) handling
- Need **ultra-high performance** (millions of requests/sec) with low latency
- Need **static IPs** per AZ (including optional Elastic IP assignment)

### NLB target groups and architecture patterns

NLB target groups can route to:

- EC2 instances
- Private IP addresses (including on-prem/private data center servers)
- An ALB (NLB in front of ALB) when you need static IPs at the edge plus layer-7 routing behind it

NLB health checks can use:

- TCP
- HTTP
- HTTPS

## 7) Hands-On: Build and Debug an NLB

### Step 1: Create NLB

- Name: `DemoNLB`
- Scheme: internet-facing, IPv4
- Enable multiple AZs/subnets
- Observe one fixed IPv4 per enabled AZ (or attach EIPs)
- Attach NLB security group (e.g. allow inbound port 80)

### Step 2: Create NLB target group

- Target type: instances
- Protocol/port: TCP:80
- Health check protocol: HTTP (valid because backend app is HTTP)
- Register both EC2 instances

### Step 3: Initial failure and root cause

At first, targets may stay unhealthy and NLB DNS won't respond properly.

Root cause in this demo: EC2 security group only allowed HTTP from the ALB SG, not from the NLB SG.

### Step 4: Fix security groups

- Update EC2 SG inbound HTTP rules to also allow source = **NLB security group**
- Keep ALB SG rule if both ALB and NLB are used

After SG update:

- NLB target health turns healthy
- NLB DNS returns app responses
- Refreshing shows traffic balancing between two EC2 instances

## 8) Gateway Load Balancer (GWLB)

The **Gateway Load Balancer** is the newest ELB type and is built for security and traffic-inspection use cases.

### What GWLB is for

Use GWLB when all network traffic should pass through third-party virtual appliances before reaching apps, such as:

- firewalls
- intrusion detection / prevention (IDS/IPS)
- deep packet inspection
- network-level payload processing

### How it works (high level)

- GWLB acts as a **transparent network gateway** (single entry/exit path)
- GWLB also acts as a **load balancer** distributing traffic to appliance targets
- Appliances inspect traffic and either:
  - forward accepted traffic back to GWLB (then on to app)
  - drop rejected traffic

This relies on VPC routing updates, so traffic is forced through the inspection path.

### Protocol/layer and exam signal

- GWLB operates at **Layer 3** (IP packet level)
- If you see **GENEVE on port 6081**, think GWLB

### GWLB target groups

Targets can be:

- EC2 instances (registered by instance ID)
- private IP addresses (including manually registered on-prem virtual appliances)

## 9) Sticky Sessions (Session Affinity)

Sticky sessions ensure repeated requests from the same client are routed to the same backend target for a period of time.

### Why use it

- Preserve session-bound state (e.g. login/session data on a specific backend instance)

### Trade-off

- Can create traffic imbalance if some users are much more active than others

### Where supported

- Classic Load Balancer (CLB)
- Application Load Balancer (ALB)
- Network Load Balancer (NLB)

### How stickiness works

- Load balancer sets/uses a cookie with expiration
- Client sends cookie on subsequent requests
- Requests stay pinned to the same backend until expiration

### Cookie models (ALB focus)

- **Application-based cookie**
  - custom app-generated cookie
  - cookie name configured per target group
  - avoid reserved names like `AWSALB`, `AWSALBAPP`, `AWSALBTG`
- **Duration-based cookie**
  - generated by load balancer
  - ALB cookie: `AWSALB` (and related managed variants)
  - CLB cookie: `AWSELB`
  - affinity duration is configured by time window

### Hands-on behavior

- Enable at target-group attributes
- Choose load-balancer-generated or application-based cookie
- After enabling, repeated refreshes tend to hit the same instance
- Disable later to return to normal balancing behavior

## 10) Cross-Zone Load Balancing

Cross-zone controls whether each load balancer node distributes only within its own AZ or across all registered targets in all AZs.

### With cross-zone ON

- Each LB node distributes traffic across targets in **all** AZs
- Helps even out instance-level load when AZs have different target counts

### With cross-zone OFF

- Each LB node sends traffic only to targets in its **local** AZ
- Can create uneven per-instance load if AZ target counts differ

### Service defaults and cost behavior

- **ALB**
  - cross-zone effectively on by default
  - target group can inherit/override behavior
  - no inter-AZ LB data-transfer charge in this context
- **NLB**
  - cross-zone off by default
  - enabling may incur inter-AZ data charges
- **GWLB**
  - cross-zone off by default
  - enabling may incur inter-AZ data charges
- **CLB**
  - off by default
  - can be enabled (legacy behavior/exam context only)

### Hands-on note

You can toggle cross-zone in LB attributes (NLB/GWLB) and use target-group-level settings for ALB.

## 11) SSL/TLS Certificates with Load Balancers

SSL/TLS certificates provide **in-transit encryption** between clients and the load balancer.

- "SSL" is commonly used in conversation, but modern deployments use **TLS**
- Certificates are issued by CAs (e.g. DigiCert, GlobalSign, Let's Encrypt)
- Certificates expire and must be renewed

### TLS termination at the load balancer

Typical pattern:

- Client -> LB over HTTPS (encrypted)
- LB terminates TLS using an X.509 certificate
- LB -> backend over HTTP or HTTPS depending on architecture

In AWS, certificates are typically managed in **ACM (AWS Certificate Manager)**, and you can also import your own certificate material.

## 12) SNI (Server Name Indication)

SNI solves serving multiple HTTPS hostnames from one load balancer endpoint.

- During TLS handshake, client sends target hostname
- LB selects matching certificate for that hostname
- Routing can then forward to the correct target group

### Where SNI support matters

- **ALB:** supports multiple certificates via SNI
- **NLB:** supports multiple certificates via SNI (TLS listeners)
- **CloudFront:** supports SNI
- **CLB:** no modern multi-cert SNI behavior; usually one certificate per LB

If exam wording says "multiple SSL certificates on one load balancer," think **ALB or NLB**.

## 13) Enabling TLS on ALB and NLB

### ALB

- Add listener: `HTTPS : 443`
- Forward to target group
- Choose TLS security policy
- Attach certificate from ACM / IAM / import

### NLB

- Add listener: `TLS` (commonly port 443, or as needed)
- Forward to target group
- Choose TLS security policy
- Attach certificate from ACM / IAM / import
- Optional advanced TLS settings (e.g. ALPN)

## 14) Connection Draining / Deregistration Delay

Same concept, different naming:

- **CLB:** Connection Draining
- **ALB/NLB:** Deregistration Delay

### What it does

When a target is deregistered or becomes unhealthy:

- LB stops sending **new** requests to that target
- Existing in-flight requests are given time to finish
- After delay expires, remaining connections close

### Configuration

- Range: `0` to `3600` seconds
- Default: `300` seconds
- `0` disables draining behavior

### Tuning guidance

- Short-lived requests -> lower delay (faster replacement/scale-in)
- Long-lived uploads/streams -> higher delay (fewer interrupted requests)

## 15) ALB Health Checks (Deep Dive)

Health checks are configured on target groups and determine whether targets receive traffic.

### Core settings

- **Protocol:** HTTP or HTTPS
- **Port:** default traffic port, or override
- **Path:** `/` or dedicated endpoint like `/health`
- **Timeout:** time before check is considered failed
- **Interval:** how often checks run
- **Healthy threshold:** consecutive successes required to mark healthy
- **Unhealthy threshold:** consecutive failures required to mark unhealthy
- **Success codes:** HTTP response codes considered healthy (not just `200` if customized)

### Target health states

- `initial`
- `healthy`
- `unhealthy`
- `unused`
- `draining`
- `unavailable`

### Important behavior

If all targets are unhealthy, ELB may still try routing to unhealthy targets as a best-effort fallback.

## 16) ALB Errors, Metrics, Logs, and Tracing

### Error families

- **4XX** -> client-side/request-side issues
- **5XX** -> server-side/backend/LB-side issues

Common examples:

- `503` often indicates no healthy targets
- `504` indicates gateway timeout conditions

### Key CloudWatch metrics

- `HealthyHostCount` / `UnHealthyHostCount`
- `RequestCount` / `RequestCountPerTarget`
- Target/backend response latency metrics
- `HTTPCode_Target_2XX/3XX/4XX/5XX`
- `SurgeQueueLength` (queued requests)
- `SpilloverCount` (rejected because queue is full)
- Active connection and capacity-unit consumption metrics

### Troubleshooting hints

- `503` -> check target health and health-check config
- `504` -> check backend keep-alive/timeout alignment with LB idle timeout
- Alarm on unhealthy hosts, 5XX spikes, queue/spillover growth

### Access logs

ALB access logs can be delivered to S3 (pay storage only) and include request metadata (client IP, path, status, latency, etc.). Useful for compliance and debugging even after instances are gone.

### Request tracing header

ALB injects `X-Amzn-Trace-Id` for request correlation across systems.

## 17) Target Group Advanced Attributes

Target groups expose several exam-relevant knobs:

- Deregistration delay (connection draining window)
- Slow start duration
- Routing algorithm
- Stickiness (type, cookie settings, duration)

### Slow start

Slow start gradually ramps traffic to newly healthy targets instead of sending a full share immediately.

- Disabled when duration is `0`
- Useful for warming caches/JIT/runtime before full load
- New target exits slow start when duration elapses (or health changes)

### Routing algorithms

- **Round robin (ALB/CLB):** equal turn-taking
- **Least outstanding requests (ALB/CLB):** send next request to least-busy target
- **Flow hash (NLB):** hash-based per-connection target selection using flow tuple; keeps a TCP/UDP flow on one target for connection lifetime

## 18) ALB Rules and Weighted Target Groups

ALB rules are processed in order; default rule is last.

### Rule actions

- Forward to target group(s)
- Redirect
- Return fixed response

### Rule conditions

- Host header
- HTTP method
- Path pattern
- Source IP
- HTTP headers
- Query string

### Weighted forwarding (blue/green/canary)

A single forwarding rule can send traffic to multiple target groups with weights.

Example:

- Target Group A weight `8`
- Target Group B weight `2`

Traffic split is ~80/20, enabling gradual rollout and monitoring of a new version before full cutover.

## 19) Auto Scaling Groups (ASG) Fundamentals

An **Auto Scaling Group** automates EC2 fleet size to match load:

- **Scale out**: add instances when load rises
- **Scale in**: remove instances when load drops

### Core capacity settings

- **Minimum capacity**: floor
- **Desired capacity**: target running count
- **Maximum capacity**: ceiling

ASG continuously tries to keep actual instance count at desired capacity (within min/max bounds).

### Why ASG + ELB is powerful

- New ASG instances auto-register into LB target groups
- Unhealthy instances can be terminated/replaced automatically
- Traffic distribution updates automatically as capacity changes

ASG itself has no direct cost; you pay for underlying resources (EC2, EBS, etc.).

## 20) Launch Templates + ASG Integration

ASG launches instances using a **Launch Template** (launch configurations are legacy/deprecated).

Typical launch template data includes:

- AMI and instance type
- User data
- Security groups
- EBS volume config
- IAM role/profile
- SSH key pair
- network/subnet parameters (plus ASG subnet choices)

In practice, you then:

1. Create ASG from launch template
2. Select VPC/AZ spread
3. Attach target group(s) for ALB/NLB integration
4. Enable EC2 and ELB health checks
5. Set desired/min/max capacity

## 21) ASG Scaling Policies

### Dynamic scaling

- **Target tracking**: keep metric near a target (e.g., CPU ~40%)
- **Simple scaling**: one alarm -> fixed add/remove action
- **Step scaling**: different scale amounts by alarm magnitude

### Scheduled scaling

Used when demand timing is known in advance (e.g., planned event/promotions).

### Predictive scaling

Uses historical patterns to forecast demand and scale ahead of time.

## 22) Metrics and Cooldown Guidance for ASG

### Common scaling metrics

- Average CPU utilization
- `RequestCountPerTarget` (ALB-aware throughput signal)
- network in/out (network-bound workloads)
- custom CloudWatch metrics

### Cooldown behavior

After a scaling action, ASG enters cooldown (default ~300s) to allow metrics to stabilize before another action.

- Too short: oscillation risk
- Too long: slow reaction risk

Using pre-baked AMIs and fast bootstrap can reduce warm-up/cooldown pressure.

## 23) Target Tracking Hands-On Pattern (What to Expect)

When target tracking is configured (example: CPU target 40%):

- High sustained CPU triggers scale-out
- ASG launches additional instances up to max capacity
- As load drops, scale-in alarms eventually trigger instance termination back toward desired/min

Operationally, you can observe this via:

- ASG Activity History
- Instance management tab (launch/terminate events)
- CloudWatch alarms created for high/low metric thresholds

## 24) Instance Refresh

**Instance Refresh** is ASG-native rolling replacement for updating fleets to a new launch template version (for example, new AMI).

### How it works

- Start refresh on ASG
- Set minimum healthy percentage (controls parallel replacement aggressiveness)
- ASG gradually terminates old-template instances and launches new-template instances
- Optionally apply warm-up time so new instances stabilize before next replacement wave

This is safer and cleaner than manually terminating instances one-by-one.

## 25) Warm Pools

Warm pools reduce scale-out latency by keeping pre-initialized instances ready for ASG expansion.

### Why they exist

New instances may take minutes to bootstrap (user-data scripts, cache priming, config fetches). Warm pools avoid waiting for full cold-start during load spikes.

### Core behavior

- Warm pool stores prepared instances in states like `Running`, `Stopped`, or `Hibernated`
- On scale-out, ASG can move an instance from warm pool into service faster than full fresh launch
- Warm-pool instances do not count toward active ASG service capacity metrics

### Sizing concepts

- Default warm pool size often derives from `max capacity - desired capacity`
- You can set:
  - **minimum warm pool size**
  - **max prepared capacity** (to limit how many prepared instances exist)

## 26) ASG Lifecycle Hooks

Lifecycle hooks let you pause instance transitions to run custom logic.

### Launch path hook

`Pending` -> `Pending:Wait` -> `Pending:Proceed` -> `InService`

Use this to run setup/checks before traffic reaches the instance.

### Termination path hook

`Terminating` -> `Terminating:Wait` -> `Terminating:Proceed` -> `Terminated`

Use this for log extraction, cleanup, snapshots, or diagnostics before final termination.

### Integrations

Hook events can be sent to EventBridge/SNS/SQS, then processed by Lambda or other automation.

## 27) Launch Template vs Launch Configuration

- **Launch Configuration**: legacy; recreate entirely for changes
- **Launch Template**: modern; supports versioning and richer capabilities

Launch templates support advanced options such as mixed instance strategies, Spot + On-Demand mix, placement features, and cleaner evolution over time.

## 28) SQS-Driven Auto Scaling Pattern

ASG can scale worker fleets based on queue backlog.

Typical flow:

1. Workers poll SQS
2. CloudWatch metric tracks queue depth (e.g., approximate message count)
3. Alarm triggers scaling policy
4. ASG adds/removes workers as backlog changes

This is a standard pattern for asynchronous processing systems.

## 29) ASG Health Check Types

ASG can use multiple health signals:

- **EC2 status checks** (default infrastructure signal)
- **ELB health checks** (application-level availability via target group/LB)
- **Custom health checks** via API/CLI (`set-instance-health`)

If instance is unhealthy, ASG replaces it (terminate + launch new) rather than relying on reboot-only recovery.

## 30) ASG Troubleshooting Essentials

Common reasons scale-out fails:

- reached ASG max capacity
- insufficient AZ capacity
- invalid launch-template references (deleted security group/key pair)
- prolonged launch failures causing ASG process suspension behavior

Always inspect:

- ASG activity history
- launch template validity
- subnet/AZ capacity context
- health check and target group status

## 31) ASG CloudWatch Metrics

### ASG-level metrics (opt-in, typically 1-minute granularity)

- `GroupMinSize`, `GroupMaxSize`, `GroupDesiredCapacity`
- `GroupInServiceInstances`, `GroupPendingInstances`, `GroupTerminatingInstances`, `GroupStandbyInstances`, `GroupTotalInstances`

### EC2-level metrics

- CPU, network, and status-check metrics are available by default
- Basic monitoring is coarser; detailed monitoring improves reaction speed for scaling decisions

## 32) AWS Auto Scaling Service and Scaling Plans

Beyond EC2 ASGs, the **AWS Auto Scaling** service provides centralized scaling management across multiple scalable resource types.

### Resources commonly covered

- EC2 Auto Scaling Groups
- Spot Fleet requests
- ECS service desired count
- DynamoDB table/index read/write capacity
- Aurora read replica scaling

### Scaling plan modes

Scaling plans can combine:

- **Dynamic scaling** (target tracking around a utilization target)
- **Predictive scaling** (forecast-based scheduling from historical patterns)

### Optimization strategies (presets)

In scaling plans, you can choose optimization posture:

- **Availability-focused** (lower target utilization, more headroom)
- **Balanced**
- **Cost-focused** (higher utilization target, less headroom)
- **Custom** metric + target value

### Advanced controls

You can tune plan behavior with options such as:

- disable scale-in (scale-out only)
- cooldown tuning
- warm-up tuning
- predictive scaling on/off

### Operational benefit

Scaling plans provide a **single control plane** to manage scaling policies across services instead of configuring each service in isolation.

## Key Takeaways

- Use **vertical scaling** for quick capacity boosts; use **horizontal scaling** for distributed workloads.
- HA requires multi-AZ strategy and failure-aware routing.
- ALB is the default choice for HTTP apps needing smart routing.
- NLB is the right choice for TCP/UDP, static IP requirements, and extreme performance.
- GWLB is for transparent traffic inspection through virtual appliances at the network layer.
- Sticky sessions improve per-user session continuity but can reduce load distribution fairness.
- Cross-zone balancing affects both distribution behavior and (for NLB/GWLB) potential inter-AZ cost.
- TLS on LB provides in-transit encryption; ACM is the standard cert management path.
- SNI enables multiple HTTPS certificates/hostnames on one ALB or NLB.
- Deregistration delay protects in-flight requests during target removal/health transitions.
- Health-check tuning directly controls failure detection speed and recovery behavior.
- ALB metrics/logs/tracing are central for troubleshooting (`HealthyHostCount`, `5XX`, queue/spillover).
- Weighted rules enable safer blue/green or canary traffic migrations.
- ASG keeps fleet size aligned with demand using min/desired/max + scaling policies.
- Launch templates are the foundation for reproducible ASG instance configuration.
- Target tracking + CloudWatch provides practical automatic scaling loops.
- Instance Refresh enables controlled fleet-wide rollout to new AMI/template versions.
- Warm pools reduce cold-start delay for faster scale-out under burst demand.
- Lifecycle hooks allow launch/termination-time automation and safer operational control.
- Queue-depth and ASG-level metrics enable robust event-driven scaling designs.
- AWS Auto Scaling plans centralize dynamic/predictive scaling across EC2, ECS, DynamoDB, Aurora, and more.
- Target groups + health checks are the core of reliable request distribution.
- Correct security-group wiring (ALB/NLB -> EC2) is critical for both security and architecture hygiene.

## Next updates

This consolidated post is set up to receive additional lecture summaries as you continue the AWS CloudOps track.
