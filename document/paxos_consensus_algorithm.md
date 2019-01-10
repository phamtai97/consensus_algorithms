# Paxos Commit
## Overview
-   A participant can have more than one role in the system – in fact, in most implementations of paxos, all partipants do have multiple roles. The roles are:
    - Clients: the client is not part of the paxos cluster. It’s an external entity whose actions trigger state changes by making requests to the paxos system. Each state update in paxos is initiated by a client request, and completed by a reply to the client.
    - Acceptor (`2F + 1 if F faults to be tolerated`): An acceptor (also called a voter) is a participant in the maintanence of distributed storage. A state change in a paxos cluster does not occur until a majority (quorum) of acceptors agree upon it.
    - Proposer: A proposer recieves a request from the client, and attempts to get a quorum of acceptors to agree on it.
    - Leader: One of the proposers is special. It is the single proposer who most recently had a proposal accepted. In many paxos implementations, there is only one active proposer serving client requests: the only time the other proposers send proposals is when the current leader fails, and a new one needs to be selected.
    - Learner: The learner is the real service provided by the paxos cluster. Once a proposal is accepted, a learner processes the request from the client, and sends it the result.
    
## Protocol steps:
### Prepare phase:
- Proposer: 
    - Proposer chooses to become the Leader and start setting a new consensis by sending a Prepare(N) message to a quorum of accepter. It can send to any group of acceptors, so long as that group forms a `majority of the acceptors`.
    - N: The prepare message specifies a numeric identifier N for its proposal, which is larger than any proposal that’s been sent by this proposer.
- Acceptor:
    - Acceptors receives the proposal:
        - If this is the first proposal to which the acceptor is going to agree. It will send a reply called a `Promise` to the proposer. Promiss is mean that it will never accept any proposal with a number less that N. This is message Promise(N, null).
        - If the N-value from the prepare message is greater than any proposal from the current round that it has accepted. And if the acceptor has accepted a proposal with number less than N, it include the pair (v, n of v) with v - consensus value, n - number of the accepted proposal. Then the acceptor will send a message Promise(N, (v, n)).
        - If N is less than any proposal, the acceptor can send Reject(n) message.
- If a majority of Acceptors fail to reply or reply message Reject(n), the Leader will abandon proposal and start again. 
- If a majority of Acceptors reply Promise message. It can move phase 2.

### Accept phase:
- The proposal chooses the value of the highest proposal number from all the Promise message. If all of the Promise were null, the proposal can chooses any value that it want to propose.
- Then the proposal will send Accept!(N, V) message to majority acceptors, where V is the proposal value of the highest numbered accepted proposal amongst the promise responses, or any value the proposer chooses if no prior acceptances are returned.
- When an Acceptor receives a `accept request` message, it sends an `accept` only if the following two conditions are met, otherwise it sends a `reject`:
    - Value is same as any of the previously accepted proposals.
    - Seq number is the highest proposal number the Acceptor has agreed to.
- It accepts the proposal by sending a message Accepted(N, V) to both the original proposer, and all of the learners.
- If the Leader does not receive an ‘accept’ message from a majority, abandon the proposal and start again.
- Otherwise the leader receives accepted messages from a majority acceptors, the new value V becomes the consensus value for the paxos cluster, and the new proposal number N is fully committed.

## Paxos Failure Handling:
- Leader fails — another Leader can take over the protocol by issuing its own proposal.
-  In such a case it is likely that the two Leaders may be proposing different values. Paxos introduces two mechanisms:
    - Assigning an order to the Leaders. This allows each node to distinguish between the current Leader and the older Leader, which prevents an older Leader (which may have recovered from failure) from disrupting consensus once it is reached.
    - Restricting a Leader’s choice in selecting a value. Once consensus has been reached on a value, Paxos forces future Leaders to select the same value to ensure that consensus continues. This is achieved by having acceptors send the most recent value they have agreed to, along with the sequence number of the Leader from whom it was received. The new Leader can choose from one of the values received from the Acceptors, and in case no one sends any value, the Leader can choose its own value.
- Partition Network: in the Paxos, this does not arise because of the majority condition.Unless a partition has majority, it cannot come to a consensus. And if a partition has majority and comes to a consensus, that value would need to be accepted by the nodes in other partitions.

## Reference

[Distributed Systems](https://www.cs.rutgers.edu/~pxk/417/notes/content/11-transactions-slides.pdf)

[Paxos made simple](https://medium.com/coinmonks/paxos-made-simple-3b83c05aac37)

[Consensus Protocols: Paxos](https://www.the-paper-trail.org/post/2009-02-03-consensus-protocols-paxos/)

[Paxos Made Simple Leslie Lamport](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf)
