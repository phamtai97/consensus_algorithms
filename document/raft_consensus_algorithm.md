# Raft Consensus Algorithm
[ What is the Raft?](#what_is_the_raft)

[Reference](reference)

## What is the Raft?
- Raft is a consensus algorithm that is designed as to `Paxos` in fault-tolerance and performance. It was meant to be more understandable than Paxos by means of separation of logic, but it is also formally proven safe and offers some additional features. And we need the system to be fully operational as long as a majority of the servers are up.

- Raft works by electing a leader in the cluster. The leader is responsible for accepting client requests and managing the replication of the log to other servers. The data flows only in one direction: from leader to other servers.

## The three sub problem in Raft
- Leader Election:  A new leader needs to be elected in case of the failure of an existing one. Raft uses `randomized timers` to elect leaders. 

- Log replication: The leader needs to keep the logs of all servers in sync with its own through replication.

- Safety:  If one of the servers has committed a log entry at a particular index, no other server can apply a different log entry for that index.

- Raft guarantees that each of these properties is true
at all times:
  - Election Safety: at most one leader can be elected in a given term.
  - Leader Append-Only: a leader `never overwrites or deletes` entries in its log; it only appends new entries.
  - Log Matching: if two logs contain an entry with the same index and term, then `the logs are identical in all entries up through the given index`.
  - Leader Completeness: if a log entry is committed in a given term, then that `entry will be present in the logs of the leaders for all higher-numbered terms`.
  - State Machine Safety: if a server has applied a log entry at a given index to its state machine, `no other server will ever apply a different log entry for the same index`.

## Raft Basic

- There are three state for each server:

![Imgur](https://i.imgur.com/md9iFN8l.png)

  - Follower: In normal operation there is exactly one leader and all of the other servers are followers. `Followers are passive`: they issue no requests on their own but simply respond to requests from leaders and candidates.
  - The leader handles all client requests (if a client contacts a follower, the follower redirects it to the leader).
  - Candidate: It is used to elect a new leader.

![Imgur](https://i.imgur.com/ZAP0xgYl.png)

- Raft divides time into terms of arbitrary length. Terms are numbered with consecutive integers. Each term begins with an election in which one or more candidates attempt to become leader. If a candidate wins the election, then it serves as leader for the rest of the term. In some situations an election will result in a split vote. In this case the term will end with no leader, a new term will begin shortly. `Raft ensure that there is at most one leader in a given term.`

- Each server stores a current term number, which increases monotonically over time. Current terms are `exchanged whenever servers communicate`; if one server’s current term is `smaller` than the other’s, then it `updates` its current term to the larger value. If a candidate or leader discovers that its term is out of date, it immediately reverts to follower state. If a server receives a request with a stale term number, it rejects the request.

- Raft servers communicate using remote procedure calls (RPCs), and the basic consensus algorithm requires only two types of RPCs:
  - `RequestVotes` is used by candidates during elections.
  - `AppendEntries` is used by leaders for replicating log entries and also as a heartbeat (a signal to check if a server is up or not — it doesn’t contain any log entries).
  
## Detail sub problem in Raft
### Leader election
- Raft uses a heartbeat mechanism to trigger leader election.
- When servers start up, they begin as followers.
- A server remains in follower state as long as it receives valid RPCs from a leader or candidate.
- Leaders send periodic heartbeats (AppendEntries RPCs that carry no log entries) to all followers in order to maintain their authority. If the election timeout, process election will begin to choose a new leader. This follower transitions to the `candidate state` and `increments its term number`. After voting for itself, it issues RequestVotes RPC in parallel to others in the cluster. A candidate continues in this state until one of three things happens:
  1. The candidate receives votes from the `majority` of the servers and becomes the leader. It then sends a heartbeat message to others in the cluster to establish authority. Each server will vote for at most one candidate in a given term, on a first-come-first-served basis. 

  2. While waiting for votes, If other candidates receive AppendEntries RPC from another server, they check for the term number. If the term number is greater than their own, they accept the server as the leader and return to follower state. If the term number is smaller, they reject the RPC and still remain a candidate.

  3. If many followers become candidates at the same time, votes could be split so that no candidate obtains a majority.When this happens, each candidate will time out and start a new election by incrementing its term and initiating another round of RequestVote RPCs. `However, without extra measures split votes could repeat indefinitely`

![Imgur](https://i.imgur.com/tdNioa8m.png)

- There are some interesting things that can happen here:
  -  Problem 1: If all nodes start at `the same time`, they would all also timeout at the same time, meaning every node would trigger this same RequestVote RPC, making it a lot harder for a single node to obtain the majority of the votes.
  - Solution: Raft used a randomized election timeout for each node, meaning one of the followers will usually timeout before the others,likely becoming the new leader.

  ![Imgur](https://i.imgur.com/TXw2Jyxl.png)

### Log replication
- Each client request contains a command to be executed by the replicated state machines.  When a leader gets a client request, it adds it to its own log as a new entry. Each entry in a log:
  - Contains the client specified command.
  - Has an index to identify the position of entry in the log (the index starts from 1).
  - Has a term number to logically identify when the entry was written.

- It needs to replicate the entry to all the follower nodes in order to keep the logs consistent. The leader issues` AppendEntries RPCs` to all other servers in parallel. In the case `followers crash or run slowly, or network packets are lost`, the leader `retries` this until all followers safely replicate the new entry. 

- Logs are organized as shown:

![Imgur](https://i.imgur.com/k72Swfd.png)

-  When the entry is replicated to a majority of servers by the leader that created it, it is considered committed. Then the leader executes the entry once it is committed and returns the result to the client.

- The leader `maintains the highest index` it knows to be committed in its log and sends it out with the AppendEntries RPCs to its followers. Once the followers find out that the entry has been committed, it applies the entry to its state machine in order.

- Raft maintains the following properties:
  - If two entries in different logs have the same index and term, then they store the same command.
  - If two entries in different logs have the same index and term, then the logs are identical in all  receding entries

- The first property follows from the fact that a leader creates at most one entry with a given log index in a given term, and log entries never change their position in the log.

- The second property is guaranteed by a simple consistency check performed by `AppendEntries`. When sending an`AppendEntries RPC`, the leader includes the `index and term of the entry in its log that immediately recedes the new entries`. If the follower does not find an entry in its log with the same index and term, then it refuses the new entries.

- This consistency check lets the leader conclude that whenever AppendEntries returns successfully from a follower, they have identical logs until the index included in the RPC.

- The problem: 
  - When the leader crashes can leave the logs inconsistent (the old leader may not have fully replicated all of the entries in its log). 
  ![Imgur](https://i.imgur.com/iburWexl.png)

  - Solution: 
    - In Raft, the leader handles `inconsistencies` by forcingthe followers’ logs to duplicate its own. This means that conflicting entries in follower logs will be `overwritten with entries` from the leader’s log. 
    - The leader tries to find the last index where its log matches that of the follower, deletes extra entries if any, and adds the new ones.
    - The leader maintains a nextIndex for each follower, which is the index of the next log entry the leader will send to that follower. When a leader first comes to power, it initializes all nextIndex  values to the index just after the last one in its log.
    - If a follower’s log is `inconsistent` with the leader’s, the AppendEntries consistency check will fail in the next AppendEntries RPC. After a `rejection`, the leader `decrements nextIndex` and retries the AppendEntries RPC.
    - If desired, the protocol can be optimized to reduce the number of rejected AppendEntries RPCs. When rejecting an AppendEntries request, the follower can include `the term of the conflicting entry and the first index` it stores for that term.

- `A leader never overwrites or deletes entries in its own log.`

### Safety
- The previous sections described how Raft elects leaders and replicates log entries. However, the mechanisms described so far are not quite sufficient to ensure that each state machine executes exactly the same commands in the
same order.
- For example, a follower might be unavailable while the leader commits several log entries, then it could be elected leader and overwrite these entries with new ones; as a result, different state machines might execute
different command sequences.
- This section completes the Raft algorithm by adding a restriction on which servers may be elected leader. The restriction ensures that the leader for any given term contains all of the entries committed in previous terms.

#### The Log Matching Property
- Raft maintains the Log Matching Property property, that says that if two distinct log entries have the same term number and the same index, then they will:
  - Store the exact same command;
  - Be identical in all the preceding entries.

#### Election restriction
- Raft uses the voting process to prevent a candidate from winning an election `unless its log contains all committed entries.`

- When the candidate send `RequestVotes` to other servers to be elected, other servers will check candidate'log. If its own log is more  `up-to-date` than that of the candidate, the voter will deny request.

- Raft determines which of two logs is more up-to-date by comparing the index and term of the last entries in the logs. 
  -  If the logs have last entries with different terms, then the log with the `later term is more up-to-date`. 
  - If the logs end with the same term, then whichever `log is longer is more up-to-date.`

#### Committing entries from previous terms
 - ????

#### Safety argument
- ????

### Follower and candidate crashes
- If a follower or candidate crashes, then future RequestVote and AppendEntries RPCs sent to it will fail. Raft handles these failures by `retrying indefinitely.`
- If a server crashes after completing an RPC but before responding, then it will receive the same RPC again after it restarts.

### Timing and availability
- `broadcastTime ≪ electionTimeout ≪ MTBF`

- `broadcastTime` is the average time it takes a server to send request to every server in the cluster and receive responses. It is relative to the infrastructure you are using.
- `MTBF` is the average time between failures for a single server.
- `electionTimeout` is the same as described in the Leader Election section. It is something you must choose.
- The broadcast time should be an order of magnitude less than the election timeout so that leaders can reliably send the heartbeat messages required to keep followers from starting elections.
### Cluster membership changes
>For the configuration change mechanism to be safe, there must be no point during the transition where it is possible for two leaders to be elected for the same term. Unfortunately, any approach where servers switch directly from the old configuration to the new configuration is unsafe.

- Raft uses a two-phase approach for altering cluster membership. First, it switches to an `intermediate configuration` called `joint consensus.` Then, once that is committed, it switches over to the new configuration.

- The `joint consensus:`
  - Log entries are replicated to all servers in both the configurations.
  - Any server from old or new can become the leader.
  - Agreement requires separate majorities from both old and new configurations.

- When a leader receives a configuration change message, it stores and replicates the entry for join consensus C<old, new>. A server always uses the latest configuration in its log to make decisions even if it isn’t committed. When joint consensus is committed, only servers with C<old, new> in their logs can become leaders.

- There are three more issues to address for reconfiguration:
  - The first issue is that new servers may not initially store any log entries.
      - Solution: The new servers join the cluster as non-voting members (the leader replicates log entries to them, but they are not considered for majorities).
  - The second issue is that the cluster leader may not be part of the new configuration.
    - Solution: the leader steps down (returns to follower state)
  - The third issue is that removed servers can disrupt the cluster. These servers will not receive heartbeats, so they will time out and start new elections.They will then send RequestVote RPCs with new term numbers, and this will cause the current leader to revert to follower state. A new leader will eventually be elected, but the removed servers will `time out again` and the process will repeat, resulting in poor availability.
    - Solution: Servers disregard RequestVote RPCs when they believe a current leader exists. 

### Log compaction
- As the log grows longer, it occupies more space and takes more time to replay. This will eventually cause availability problems without some mechanism to discard obsolete information that has accumulated in the log.
- Snapshotting is the simplest approach to compaction.

## Reference

[In Search of an Understandable Consensus Algorithm](https://raft.github.io/raft.pdf)

[Understanding the Raft consensus algorithm: an academic article summary](https://medium.freecodecamp.org/in-search-of-an-understandable-consensus-algorithm-a-summary-4bc294c97e0d)

[Heartbeat (computing)](https://en.wikipedia.org/wiki/Heartbeat_(computing))

[Raft](http://thesecretlivesofdata.com/raft/)

[raftscope-replay](https://raft.github.io/raftscope-replay/index.html)

[Awesome-consensus](https://github.com/dgryski/awesome-consensus)
