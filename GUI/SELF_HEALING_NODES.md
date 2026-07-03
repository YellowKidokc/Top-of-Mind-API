# Self-Healing Nodes

## Purpose

The hub should not behave like a fragile single-machine tool. It should behave like a small resilient network. If the same hub runs on two computers, both nodes should be able to check their own health, report their state, compare that state with the peer, and repair missing or damaged pieces when the policy allows it. The point is not to create a giant distributed system. The point is to make the operator surface survive ordinary failures without David having to babysit every restart, watcher crash, or missing config file.

The clean mental model is this: each machine is a **node agent** with local autonomy, but the pair of nodes form a **mutual recovery mesh**. Each node can work alone. Each node can report health. Each node can help the other heal.

## Core Principle

Self-healing should happen in layers. A node should always try the least invasive repair first. If a local restart solves the issue, it should restart locally. If a local file can be rebuilt from a template or schema, it should rebuild locally. Only when local repair fails or the local state is incomplete should the node request help from its peer.

That means “self-healing” does not immediately mean “copy everything from the other computer.” It means:

1. detect
2. classify
3. attempt local repair
4. compare with peer
5. borrow or copy only the missing or damaged component
6. log every step

## What Runs On Each Node

Each computer should run the same basic node package:

- local watcher
- local worker runner
- local SQLite ledger
- local health service
- peer sync client
- peer repair endpoint

The node does not need every heavy feature turned on at all times. It only needs enough local intelligence to observe files, process jobs, maintain heartbeat state, and answer recovery requests. The intelligence layer can stay split: watcher, classifier, API enrichment, ledger, GUI. The self-healing layer sits beside that and monitors whether those parts are healthy.

## Health Checks

Each node should run a scheduled health check on a fixed interval. For the first version, an every-5-minute or every-10-minute loop is enough. A health check should inspect the things that actually matter operationally:

- is the watcher process alive
- is the worker process alive
- is the API surface reachable
- is the SQLite database writable
- are folder profile files present and valid
- are required schemas present
- are required startup scripts present
- is the job queue moving
- are retryable jobs accumulating abnormally
- has the node heartbeat updated recently

The output should not just be “healthy” or “unhealthy.” It should classify the issue:

- `healthy`
- `degraded_local`
- `repairable_local`
- `needs_peer_assist`
- `isolated_but_running`
- `critical`

That classification is what makes the system manageable. A broken watcher is different from a corrupt config, and both are different from a dead node.

## Synchronized Peer Checks

Both nodes should run health checks on the same schedule and exchange summaries. The exchange does not need to be fancy. It can be a lightweight signed JSON heartbeat over the local network through the FastAPI service. The important thing is that each node knows:

- whether the other node is alive
- what version it is running
- whether its watcher is healthy
- whether its worker queue is healthy
- whether its config and schemas pass validation
- whether it has files or templates that can be used for repair

If both nodes run checks at roughly the same time, then each machine has a near-current picture of the pair instead of a stale guess. That makes peer repair safer because each node knows whether the other one is truly healthy enough to be trusted as a source.

## Borrow Versus Copy

There should be two distinct recovery modes.

### Borrow

Borrow means using the peer as a temporary live source without permanently replacing local state yet. This is good for:

- loading a missing schema
- validating against a peer copy
- comparing config hashes
- pulling a temporary startup template
- confirming whether a file difference is corruption or legitimate drift

Borrow is safer because it keeps the system from overwriting local state too early.

### Copy

Copy means taking an approved peer artifact and restoring it locally. This is good for:

- missing schemas
- missing example configs
- broken startup scripts
- known-good static assets
- template files
- node package support files

Copy should be used only for artifacts that are either versioned or policy-approved as replaceable. It should not silently replace SQLite ledgers or operator-authored content files.

## What Should Never Auto-Copy

Some things are too important or too context-sensitive to auto-replace. The following should require explicit policy or approval:

- live SQLite ledger files
- local review decisions
- user content files
- folder-specific local preferences
- secrets
- credentials
- API tokens

If those become damaged, the node can report the problem, offer a recovery path, or restore from an approved backup channel, but it should not silently overwrite them from the peer.

## Recommended Repair Order

When a node detects a problem, the repair order should be:

1. confirm the failure with a second check
2. classify the failure
3. attempt local process restart if applicable
4. attempt local template/schema regeneration if applicable
5. compare local file hash/version against peer
6. borrow peer artifact for validation if needed
7. copy peer artifact only if the asset is marked auto-repairable
8. write repair result to ledger
9. report final status in next heartbeat

This keeps the system from thrashing and keeps every repair legible afterward.

## Ledger Requirements

Self-healing only matters if it is auditable. Every health check and every repair action should enter the ledger. That means new or expanded record types such as:

- node heartbeat
- health check result
- peer health snapshot
- repair attempt
- repair outcome
- borrowed artifact record
- copied artifact record
- restart action
- escalation needed

This can live in SQLite first. Later, if the system grows, it can be mirrored upward. But the first rule is that the local ledger should always be enough to explain what the node thought, what it did, and why.

## Suggested New Channels

The control plane should eventually include explicit channels for:

- `node.heartbeat`
- `node.health.report`
- `node.health.compare`
- `node.repair.request`
- `node.repair.offer`
- `node.repair.borrow`
- `node.repair.copy`
- `node.repair.result`
- `node.failover.signal`

These do not all need to be public API routes at once. Some can begin as internal service functions. The important thing is that the architecture treats node health as a first-class lane, not as accidental side behavior.

## Failover Behavior

If one node goes down entirely, the other node should not panic. It should mark the peer as unavailable, continue local processing where safe, and switch to `isolated_but_running`. If both nodes are up but one node’s watcher or worker fails, the healthy peer should be able to provide recovery hints or approved artifacts without taking over ownership of the damaged node’s ledger.

The first version should not attempt full active-active distributed work stealing. That is a later feature. The first version should focus on:

- heartbeat
- health visibility
- peer-assisted repair
- clean recovery logs

That is enough to deliver real resilience without turning the hub into a complicated cluster product.

## Where This Fits In The Existing Hub

This design fits naturally into the current hub direction:

- the watcher already exists
- the worker runner already exists
- the FastAPI app factory already exists
- the SQLite ledger already exists
- heartbeat fields already exist in jobs

What is missing is not the entire foundation. What is missing is the explicit node-health layer and the peer-repair policy layer.

## Best Version 1 Build Order

The next self-healing build should happen in this order:

1. add node identity and heartbeat table/schema support
2. add local health check service
3. add peer heartbeat exchange endpoint
4. add health status comparison logic
5. add approved-artifact hash comparison
6. add borrow/copy repair actions for static/config assets
7. add ledger rows for health and repair history
8. add GUI surface for node health view and repair confirmations

## Bottom Line

The right self-healing design is not “if something breaks, copy everything from the other machine.” The right design is a disciplined two-node recovery mesh. Both machines should run health checks, both should exchange health summaries, both should know which assets are safe to borrow or copy, and both should log every repair path. That gives the hub the feel of a living system instead of a pile of scripts waiting to fail alone.
