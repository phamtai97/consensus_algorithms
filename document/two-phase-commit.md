#Two-phase commit

<p align="center">
  <img src="https://i.imgur.com/A81m84ym.png">
</p>

<p align="center">
  <img src="https://i.imgur.com/DYzgzf8m.png">
</p>

- Distributed two-phase commit reduces the vulnerability of one-phase commit protocols.

## Steps in commit:
  - Phase 1: `Prepare phase`
      - After each slave node complete its transaction, it will send a "DONE" message to coordinator node. When coordinator node has received "DONE" message from all slaves, it sends a "Prepare" message to the slaves node.
      - The slaves node will vote. If a slave want to commit, its will send a "Ready" message. If a slave want not to commit, its will send a "Not Ready" message.

      <p align="center">
        <img src="https://i.imgur.com/ZKyjU46l.png">
      </p>

  - Phase 2: `Commit/Abort Phase`
      - After all slave sent vote, they will be blocked until receive message from coordinator node.There are 2 cases:
        - Case 1: 
            - Coordinator node received "Ready" message from all the slaves:
                - The coordinator node will send a "Global Commit" message to the slaves node.
                - The slaves apply the transaction and send a "Commit ACK" message to the coordinator node.
                - After the controloling received "Commit ACK" from all slaves node, it considers the transaction as committed.
        - Case 2:
            - The coordinator node received "Not Ready" message from any the slaves:
                - The coordinator node will send a "Global Abort" message to the slaves node.
                - The slaves node abort the transaction and send a “Abort ACK” message to the coordinator node.
                - After the controloling received "Abort ACK" from all slaves node, it considers the transaction as abort.

        <p align="center">
          <img src="https://i.imgur.com/v3twia4l.png">
        </p>

## The problems:
  - Phase 1:
      - Problem 1:
          - The coordinator node could crash before it send "Prepare" message to slaves node.
          - Solution:
              -  This doesn’t cause us too much worry, as it simply means that 2PC never gets started.
      - Problem 2:
          - The coordinator node could crash after it sent "Prepare" message some slaves. We will have some slaves node received and start 2PC round, and some slaves node never gets start. And if the coordinator doesn’t recover for a long time, the nodes that received the proposal are going to be blocked waiting for the outcome of a protocol that might never be finished.
          - These nodes will have sent back their votes to the coordinator - unaware that it has failed - and therefore can’t simply timeout and abort the protocol since there’s a possibility the coordinator might reawaken, see their ‘commit’ votes and start phase two of the protocol with a commit message.
          - Solution: 
              - We can get another participant node to take over the job of the coordinator node. This node can contact all the slaves node to find vote of them.
              ->  This requires all nodes to keep in persistent storage the results of all 2PC executions.
          
          <p align="center">
            <img src="https://i.imgur.com/9tuuOAAl.png">
          </p>

      - Problem 3:
          - The coordinator node did not receive enought vote message from all slaves node. It mean is some slaves is crashed.
          - Solution:
              - coordinator will have timeout, if time out, it will broadcast "Not ready" message to all slaves node except for crashed node.

      - Problem 4: 
          - The slave is die after sent vote.
          - Solution:
              - If the coordinator received the vote, it waits for other votes and go to phase 2.
              - ⇒ Otherwise: wait for the participant to recover and respond (keep querying it).

  - Phase 2:
      - Problem 1: 
          - The slaves node does not receive commit or abort message from coordinator node. It may the coordinator is crashed before it send.
          - Solution: the same solution solved problem 2 of phase.
      - Problem 2: 
          -  Another slave node crashes before the recovery node can finish the protocol, the state of the protocol cannot be recovered. The recovery node will not know crashed slave node is sent "Ready" or "Not Ready".
          - Solution: use local log of slave node.

      - Problem 3:
          - The coordinator node is timeout when wait ACK message from slaves node.
          - Solution: use local log of slave node.


- The co-ordinator typically will log the result of any succesful protocol in persistent storage, so that when it recovers it can answer inquiries about whether a transaction committed. This allows periodic garbage collection of the logs at the participant nodes to take place: the coordinator can tell nodes that no-one will try to recover a mutually committed transaction and that they can erase its existence from their log (that said, the log might be kept around to be able to recover a node’s state after a crash).
 
- Adding a recovery coordinator:
    - Another system can take over for the coordinator:
        - Could be a participant that detected a timeout to the coordinator.
    - Recovery node needs to find the state of the protocol:
        - Contact ALL participants to see how they voted:
            - If we get voting results from all participants:
                - We know that Phase 1 has completed.
                - If all participants voted to commit ⇒ send commit request.
                - Otherwise send abort request.
    - If ANY participant states that it has not voted:
        - We know that Phase 1 has not completed.
        -> Restart the protocol.
    - But if any participant node also crashes, we’re stuck!
        - Have to wait for recovery

- The other problems:
    - Blocking: if coordinator node fails, the slaves is blocked until coordinator node recovery.
    - There is no way to finish with commit until coordinator and all participants are available. In other words the participant can’t reach a final state in presence of a failure.
    - If the coordinator node and slaves node are crashed:
        - The system has `no way of knowing the result of the transaction`.
        - It might have committed for the crashed participant – hence all others must block. 
    - `The protocol cannot pessimistically abort because some participants may have already committed`
    When a participant gets a commit/abort message, it does not know if every other participant was informed of the result.
