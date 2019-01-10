# Consensus algorithms
[1. Understanding the 8 Fallacies of Distributed Systems](#1-understanding-the-8-fallacies-of-distributed-systems)

[1.1 The Network Is Reliable](#11-the-network-is-reliable)

[1.2 Latency is Zero](#12-latency-is-zero)

[1.3 Bandwidth Is Infinite](#13-bandwidth-is-infinite)

[1.4 The Network Is Secure](#14-the-network-is-secure)

[1.5 Topology Doesn't Change](#15-topology-doesn't-change)

[1.6. There Is One Administrator](#16-there-is-one-administrator)

[1.7 Transport Cost Is Zero](#17-transport-cost-is-zero)

[1.8 The Network Is Homogeneous](#18-the-network-is-homogeneous)

[2. CAP Theorem](#2-cap-theorem)

[3. ACID](#3-acid)

[4. Consistency and Replication](#4-consistency-and-replication)

[4.1 Overview](#41-overview)

[4.2 Problem](#42-problem)

[4.3 Strategies](#43-strategies)

[4.4. Strong consistency models](#44-strong-consistency-models)

[4.5 Conflict-free replicated data type CRDT](#45-conflict-free-replicated-data-type-crdt)

[5. What is the Blockchain ?](#5-what-is-the-blockchain)

[6. Consensus Algorithms](#6-consensus-algorithms)

[6.1 Proof-of-Work (PoW)](#61-proof-of-work-pow)

[6.2 Proof-of-Stake (PoS)](#62-proof-of-stake-pow)

[6.3 Delegated Proof-of-Stake (DPoS)](#63-delegated-proof-of-stake-dpos)

[6.4 Proof-of-Authority (PoA)](#64-proof-of-authority-poa)

[6.5 Proof-of-Weight](#65-proof-of-weight)

[6.6 Proof-of-Reputation ](#66-proof-of-reputation)

[6.7 Proof of Elapsed Time](#67-proof-of-elapsed-time)

[6.8 Byzantine Fault Tolerance](#68-byzantine-fault-tolerance)

[6.9 One-phase commit](#69-one-phase-commit)

[6.10 Two-phase commit](document/two-phase-commit.md)

[6.11 Three-phase commit](#611-three-phase-commit)

[6.12 Paxos Commit](document/paxos_consensus_algorithm.md)

[6.13 Raft Consensus Algorithm](document/raft_consensus_algorithm.md)

[Reference](#reference) 


## 1. Understanding the 8 Fallacies of Distributed Systems
### Overview
![Imgur](https://i.imgur.com/hNju92s.jpg)

 - Distributed systems are comprised of many computers that coordinate to achieve a common goal.

- More than 20 years ago Peter Deutsch and James Gosling defined the 8 fallacies of distributed computing.

- The 8 fallacies are:
    - The network is reliable.
    - Latency is zero.
    - Bandwidth is infinite.
    - The network is secure.
    - Topology doesn't change.
    - There is one administrator.
    - Transport cost is zero.
    - The network is homogeneous.

### 1.1 The Network Is Reliable
#### The problem
`Call over a network will fail`
- Most of the systems today make calls to other systems.
- What happens if a call fails. If we are quering data, we can query again. But what if we are sending a `COMMAND`. Example:
  - We send command with content: `pay order on tiki by creditcard`. What happen if we receive an HTTP timeout. There are two cases. Firstly, if the server of Tiki did not process the our request, then we can retry. This is easy case. Second, if the server did process the our request, we need to make sure that we are not double pay. If you're not properly handling these errors, you're system is nondeterministic.

#### The solution
- We can use automatically retry. `Queuing systems` are very good at this. MSMQ is an example of such a queuing system.

![Imgur](https://i.imgur.com/BRsMssq.png)

But we cannot just replace each web service call with a queue send.  We have to move from a request/response model to fire and forget (publish message without waiting for response).

- Problem other is hardware and software can fail. People can start DDOS attacks or they can sabotage physical equipment.

![Imgur](https://i.imgur.com/IwgPb81.png)

Therfor, we can minimize the chance of failure by investing in infrastructure and software

### 1.2 Latency is Zero
#### The problem
`Calls over a network are not instant.`
- There is a difference between in local call and remote call. Remote call always have latency. We should clearly separate local calls from remote calls.
Example:

![Imgur](https://i.imgur.com/IIaNFyb.png)

- There are two remote call at line 2 and 5. In line 5 can have n + 1 remote call. Repeated remote calls will lead to high latency.

#### The solution
- `Bring Back All the Data You Might Need`: we should get all data that we need limit remote call instead of multiple calls.
- `Move the Data Closer to the Clients`: we can use cache in other to minimize the number of network calls. Besides, we can use CDN for provide static contents.

#### Invert the Flow of Data
- Instead of querying other services, we can use Pub/Sub and store the data locally. This way, we'll have the data when we need it.

![Imgur](https://i.imgur.com/fXGP6Pp.png)

### 1.3 Bandwidth Is Infinite
#### The problem
`Bandwidth is limit`. Although bandwidth has improved over time, the amount of data that we send has increased too.

#### The solution
`Domain-Driven Design patterns` can help:
- First, you should not strive for a single, enterprise-wide domain model. You should partition your domain into `bounded contexts`.

![Imgur](https://i.imgur.com/njgbdRw.png)

- To avoid large and complex object graphs inside a bounded context, we could use the `Aggregate pattern`. Aggregates ensure consistency and define transactional boundaries.

![Imgur](https://i.imgur.com/qf3LyDZ.png)

`Command and Query Responsibility Segregation-CQRS`. This means spliting the domain model in two:

![Imgur](https://i.imgur.com/JRccHwo.png)

- The write model (command) will handle create, update, and delete requests and emits events when data changes. Since the write model doesn't care about view concerns, it can be kept small and focused.
- The read model (query) will handel queries by executing them against one or more views that are kept up to date by subscribing to the stream of events emitted when data changes. It can bigger than write model.

- There are two contrasts. These are the `latency is not 0` and `the bandwith infinite`. We shound tranfer more data to minimize the number of network round trips. BUT we should also tranfer less data to minimize bandwidth usage.
> We need balance these two force. And So transfer only the data that you might need.

![Imgur](https://i.imgur.com/xdEwyin.jpg)

### 1.4 The Network Is Secure
#### The problem
`The network is insecure.`
- The attackers of today have a lot of computing power in their hands and a lot of patience. So the question is not if they're going to attack your system, but when.

#### The solution
`Defense in Depth`:  we need different security checks at the network, infrastructure and application level.
`Security Mindset`: 
- Keep security in mind when designing your system. 
- We should follow best practices for secure software design and review code for common security flaws. 
- We should regularly search 3rd party libraries for new vulnerabilities.

`Threat modeling`:
- It help identifying posiable security threats in a system.

![Imgur](https://i.imgur.com/GWm9Dfx.png)

> We can prevent certain types of attacks by using threat modeling, but we can't guarantee 100% security.

### 1.5 Topology Doesn't Change
#### The problem
`Network topologies change constantly.`

![Imgur](https://i.imgur.com/6McLGj5.jpg)

#### The solution
`Abstract the Physical Structure of the Network.` There are several ways in which you can do that:
- Stop hardcoding IPs - You should prefer using hostnames. By using URIs we are relying on the DNS to resolve the hostname to an IP.

![Imgur](https://i.imgur.com/t3EqjBB.png)

- When DNS is not enough (e.g. when you need to map an IP and a port), then use `discovery services`.

![Imgur](https://i.imgur.com/GiddH6y.png)

![Imgur](https://i.imgur.com/RSdU0J6.png)

- Service Bus frameworks can also provide location transparency.

![Imgur](https://i.imgur.com/dZwnSS5.png)

`Cattle, Not Pets`:
- Let's see if the service is cattle. Since any server can fail lead to changing the topology. So we should automate as much as we can.

![Imgur](https://i.imgur.com/Hb8KdOz.png)

`Test`

> We need to be prepared for failure and test for it. Don't wait for it to happen in production!

### 1.6. There Is One Administrator
#### The problem
`There is no one person who knows everything.`
- When we have many server or service in systems and somethings it goes wrong. If we only one administrator can fix it, we will can not control our system.

![Imgur](https://i.imgur.com/j1vwjJN.jpg)

#### The solution
`Everyone Should Be Responsible for the Release Process`
- The adminstrator will be part of the team.

`Logging and Monitoring`
- The systems adminstrators should have the right tool for error reporting and managing issues. And we should have centralized logging, monitoring.

`Decoupling`
- We should be able to upgrade different parts of the system independently. By making the components backward-compatible, you can update the server and the clients at different times. Putting queues between components is idea good.

`Isolate Third-Party Dependencies`
- When a 3rd party system fails, you'll have fewer places to look for bugs.

![Imgur](https://i.imgur.com/9kLsI9h.png)

### 1.7 Transport Cost Is Zero
#### The problem
`Transport cost is not zero.`

![Imgur](https://i.imgur.com/nOoMZjH.jpg)

- Transporting on the network has a price, in both time and resources.
- The Cost of the Networking Infrastructure such as Server, SANs, network switches, load balancers and the people who take care of this equipment,..
- The Cost of Serialization/Deserialization sush as Serialization and deserialization consume CPU time, so it costs money.

#### The solutiuon
- The best solution is we uses it efficientky as possiable.

### 1.8 The Network Is Homogeneous
#### The problem
`The network is not homogenous.`
- We have many service communicate with each other and communicate with other services outside the system.

#### The solution
- We should choose standard formats in order to avoid vendor lock-in. This might mean XML, JSON or Protocol Buffers. 

## 2. CAP Theorem

![Imgur](https://i.imgur.com/n7tnSB3.png)

> CAP Theorem is a concept that a distributed database system can only have 2 of the 3: Consistency, Availability and Partition Tolerance.

- Type CA: RDBMS systems such as Oracle, MySQL
- Type CP: mongoDB, HBASE, Redis,..
- Type AP: Cassandra, CouchDB, riak...

![Imgur](https://i.imgur.com/obqjXqW.png)

## 3. ACID
![Imgur](https://i.imgur.com/lNMBlsq.png)

- Atomic: All components of a transaction are treated as a single action. All are completed or none are; if one part of a transaction fails, the database’s state is unchanged.

- Consistent: Transactions must follow the defined rules and restrictions of the database.Thus, any data written to the database must be valid and any transaction that completes will change the state of the database. No transaction can create an invalid data state

- Isolated: the incomplete transaction cannot affect another incomplete transaction

- Durable: the cofirmed data will be saved that even in the event of a malfunction or system failure, and the data remains in the correct state.

### How is CAP Consistency different from ACID Consistency?
- [Disambiguating ACID and CAP](https://www.voltdb.com/blog/2015/10/22/disambiguating-acid-cap/)

## 4. Consistency and Replication
### 4.1 Overview
- There are two primary resaons for replicating data:
    - Date will increase the reliability of a systems.
    - Performance when a distributed system needs to scale. In that case, performance can be improved by replicating the server and subsequently dividing the workload among the processes accessing the data.

### 4.2 Problem
- Big problem: a collection of copies is consistent when the copies are always the same.
- There is no such thing as a best solution to replicating data. Replicating data poses consistency problems that cannot be solved efficiently in a general way.

### 4.3 Strategies
- We can be grouped into two main categories:

#### Synchronous Replication
- If a update request come a one node, than we must broadcast the update to all of the other nodes and wait for acknowledgment from them. When it gets all acknowledgment, it reply back to the client.
- However this solution is not scalable.

#### Asynchronous Replication
- If a node receives a update request, it updates it’s local copy and immediately return a response to the client, In the background it tries to propagate the updates to other nodes.
- However the solution have problem.
Example: [here](https://medium.com/@naveennegi/rendezvous-with-riak-crdts-part-1-e94cfc8fe091)

#### Conflict Resolution : diverge → Rollback → Converge
- The means that whenever a node diverges or has a conflict, system will rollback changes in the conflicting node and try the bring it in the same sate as other nodes.
- In order to achieve this, nodes has to restore to something called as consensus algorithm (for example Paxos or Raft).

### 4.4. Strong consistency models
####  Overview Strong Models
![Imgur](https://i.imgur.com/ma9iMR4.png)

- Data will get passed on to all the replicas as soon as a write request comes to one of the replicas of the database.
- But during the time these replicas are being updated with new data, read/write requests by any of the replicas will get delayed.
- In distributed systems, a consistency model is a contract between the system and the developer who uses it.

#### Some strong consistency models
- Strict Consistency:
    - Under model, a write to a variable by any processor needs to be seen instantaneously by all processors.  A distributed system with many nodes will take some time to copy information written to one node to all the other nodes responsible for replicating that information.
    => Therefore, strict consistency is impossible. The best one can do is design a system where the time-to-replicate approaches the theoretical minimum.

- Correctness:
    -  As the system runs, it moves from state to state through some history of operations.

![Imgur](https://i.imgur.com/EnaSvQV.jpg)

- Concurrent histories:
    - Now imagine a concurrent program. A process is allowed to read the most recently written value from any process, not just itself. The register becomes a place of coordination between two processes; they share state.

![Imgur](https://i.imgur.com/fhZJINh.jpg)

- Light cones:
    -  In almost every real-world system, processes are distant from each other. Example, the bottom process invokes a read when the value is a. While the read is in flight, the top process writes b–and by happenstance, its write arrives before the read. The bottom process finally completes its read and finds b, not a

![Imgur](https://i.imgur.com/xVM0TuJ.jpg)

- Linearizability
    - The message informing the process that its operation completed cannot travel back in time, which means that no operation may take effect after its completion.
    - linearizable = sequential + operations ordered according to a global time.
    - We can use the atomic constraint of linearizability to mutate state safely.We can use compare-and-set as the basis for mutexes, semaphores, channels, counters, lists, sets, maps, trees–all kinds of shared data structures become available. 
    -  Linearizability’s time bounds guarantee that those changes will be visible to other participants after the operation completes. Hence, linearizability prohibits stale reads.

![Imgur](https://i.imgur.com/ZumF9Qu.jpg)

- Sequential consistency:
    - In this model,The result of any execution is the same as if the (read and write) operations by all processes on the data store were executed in some sequential order and the operations of each individual process appear in this sequence in the order specified by its program
    - Sequential consistency allows more histories than linearizability.

![Imgur](https://i.imgur.com/fLGDDRg.jpg)
![Imgur](https://i.imgur.com/CLRJ3XU.png)

- Causal consistency:
    - Writes that are potentially causally related must be seen by all processes in the same order. Concurrent writes may be seen in a different order on different machines.

![Imgur](https://i.imgur.com/UizxhdH.png)

- Serializable consistency

- FIFO Consistency:
    - Necessary condition:
        - Writes done by a single process are seen by all other processes in the order in which they were issued, but writes from different processes may be seen in a different order by different processes.

### 4.5 Conflict-free replicated data type CRDT
#### Overview
![Imgur](https://i.imgur.com/LZRuiR5.jpg)

- In distributed computing, a conflict-free replicated data type (CRDT) is a data structure which can be replicated across multiple computers in a network, where the replicas can be updated independently and concurrently without coordination between the replicas, and where it is always mathematically possible to resolve inconsistencies which might result. Other concepts, CRDT is a type of specially-designed data structure used to achieve strong eventual consistency (SEC) and monotonicity (absence of rollbacks).

#### Approaches
- There are two approaches to CRDTs: 
    - State-based replication: 
        - When a replica receives an update from a client it first updates its local state, and then some time later it sends its `full state` to another replica.
        - And a replica that receives the state of another replica applies a merge function to merge its local state with the state it just received. So every update eventually reaches all replicas in the system.
        - A replicated object satisfying this property is called CvRDT (Convergent Replicated Data Type).

        ![Imgur](https://i.imgur.com/oQ7e6VE.png)

    - Operation-based replication:
        - Data can be huge, so the replica do not send `full state` to another replica.
        - It will broadcasts the update operation to all the other replica in the system and expects them to replay that update.
        - The problem is when we have more updates and the replicas receives it in disorder. They can converge if these updates are `commutative`. 
        ```
        Example, add(item A) + add (item B) + remove (item B) = add(item A) + remove (item B) + add (item B)
        ```
        -  In this model where the updates are broadcast to all replicas, an object for which all concurrent updates are commutative is called a CmRDT (Commutative Replicated Data Type).

        ![Imgur](https://i.imgur.com/IWRt65g.png) 

- There are some mathematical properties:
    - Commutative: Order Independence:
        ```
        - Example, add(item A) + add (item B) + remove (item B) = add(item A) + remove (item B) + add (item B)
        ```
    - Idempotent: Immune to duplication and redelivery:
        - CRDTs can handle duplication and redelivery of same update.
        ```
        - Example, add(item A) + add(item A) = add(A)
        ```

#### Benefit
- `Strong Eventual consistency` without Consensus or concurrency control which leads to high performing and scalable systems.
- `Solves CAP theorem`: if you accept SEC instead of Strong consistency than you can have all three.
- `Any kind of update is allowed with no conflict` because CRDTs guarantees that these update will eventually converge.

#### How to use a CRDT in application
- Counters (polling, likes, hearts, emoji counts): We may have a geo-distributed application that is collecting the votes, measuring the number of “likes” on an article, or tracking the number of emoji reactions to a message.

![Imgur](https://i.imgur.com/q0TcJLC.png)

- Distributed caching: The caching mechanism for a distributed cache is the same as the one used in local caching. The database will automatically makes the cache available across all the regions.

![Imgur](https://i.imgur.com/RzoQgaA.png)

![Imgur](https://i.imgur.com/LghJFpY.png)

- Collaboration using shared session data: CRDTs were initially developed to support multi-user document editing. Shared sessions are used in gaming, e-commerce, social networking, chat, collaboration, emergency responders, and many more applications.

![Imgur](https://i.imgur.com/o8kvUdz.png)

![Imgur](https://i.imgur.com/uNBtUg8.png)

![Imgur](https://i.imgur.com/ZfHCj2o.png)

- Multi-region data ingest: 

![Imgur](https://i.imgur.com/8vLsD2O.png)

## 5. What is the Blockchain
### Overview
- Blockchain = Data structure
    - A blockchain refers to a series of blocks, which consists of a block header and a list of transactions, in chronological order.

    ![Imgur](https://i.imgur.com/vTPdzIz.png)

- Blockchain network = Distributed and decentralized network
    - A blockchain network is a `distributed and decentralized` network where every network node synchronizes among others to stores the same blockchain data structure and executes the same transactions in the same order.
    - Blockchain network is `peer-to-pee`r, meaning that every network node is connected to each other directly.

    ![Imgur](https://i.imgur.com/cmvVDwS.png)

- Everyone owns the same data
    - When created new block by different network nodes and linked to an existing blockchain. Then, the new blocks are being copied and synchronized among all peers on the network. So `every network node will eventually have the exact same copy of blocks`.

    ![Imgur](https://i.imgur.com/FxTQizT.png)

- Highly available
    - Because every network node has a copy of the blockchain data, and the nodes are distributed and decentralized, so these makes the blockchain network with `no downtime and free from the problem of single point of failure`.

- Open to everyone and fully transparent
    - The size of blockchain can grow or shirk, depending on the number of network nodes.
    - Everyone can join a blockchain network or quit from it at any time.
    - Because when everyone join the blockchain network, everyone can get a copy of the blockchain, therefore, every transaction and block stored in a blockchain is fully-transparent.

- No one discloses their true name
    - Users on the blockchain network do not have to disclose their real name or credentials on the network to communicate or make transactions with others.
    - To use the blockchain network, every user should own at least one public and private key pair

    ![Imgur](https://i.imgur.com/dz8iwcr.png)

    - When users try to make a transaction on the blockchain network, they will use the public key of the person involved for references.

    ![Imgur](https://i.imgur.com/PH2utpn.png)

- Transactions are secured by digital signatures
    - Every transaction needs to be digitally signed by the originator to prove its authenticity.

    ![Imgur](https://i.imgur.com/4IKuPMW.png)

- No one can change or delete once published 
    -  Once a transaction is being executed or stored, no one can alter or delete the data, or undo the operation.
    - In fact, blocks are connected by the cryptographic hash of its previous block.

    ![Imgur](https://i.imgur.com/JDjDRMT.png)

    - Blocks are referencing its previous block by using cryptographic hashes.
    - This is three mechanism:
        - Linked previous hash values.
            - The cryptographic hash of a block N is used to compute the cryptographic hash of its next block N+1, and the cryptographic hash of block N+1 is used to compute the cryptographic hash of its next block N+2, and so on.
            - `Changing one data (even just a single character) in block N will affect its block hashes as well as all block hashes that are ahead of block N.`
        - Nonce values.
            - The miner need caculate the nonce value to meet certain criteria for each affecred block through a process called mining.
        - The longest chain rule.
            - `If you have two or more valid chains, always select the longest one`

            ![Imgur](https://i.imgur.com/jeezITK.png)


## 6. Consensus Algorithms

![Imgur](https://i.imgur.com/nUQoLPM.png)
### Overview
- What’s trustless and distributed consensus?
A trustless and distributed consensus system means that if you want to send and/or receive data from someone you don’t need to trust in third-party services.

### 6.1 Proof-of-Work (PoW)

![Imgur](https://i.imgur.com/2HCm9fY.png)

- Devised by Satoshi Nakamoto for use in the Bitcoin blockchain.
- In Blockchain, this algorithm is used to confirm transactions and produce new blocks to the chain. With PoW, miners compete against each other to complete transactions on the network and get rewarded.

- Mining serves as two purposes:
    - To verify the legitimacy of a transaction.
    - To create new digital currencies by rewarding miners for performing the previous task.

- The main working principles is a complex mathematical puzzle and the task is to find a way to solve it as quickly as possible.
- When you make a transaction, this is what happens:
    - Transactions are bundled together into what we call a block.
    - Miners verify that transactions within each block are legitimate.
    - To do so, miners should solve a mathematical puzzle known as proof-of-work problem.
    - A reward is given to the first miner who solves each blocks problem.
    - Verified transactions are stored in the public blockchain.
- `Why is Mathematical puzzle ?`. If the problem is too easy it is prone to vulnerabilities, Dos attacks and spam. But the problem shouldn't be too complicated. If it is too complicated, the block generation takes a lot of time. The transactions are stuck, so the workflow hangs for some time.

- Mathematical puzzle:
    - `hash function`
        - Find the input knowing the output.
        - Use SHA256
- `How is this algorithm implemented in Blockchain?`
    - Miners solve the puzzle, creat the new block, then confirm the transactions.
    - How complex a puzzle is depends on the number of users, the current power and the network load. The hash of each block contains the hash of the previous block, which increases security and prevents any block violation.

    ![Imgur](https://i.imgur.com/Ngc3XG4.png)

    - If miner complete to solve the puzzle, the new block is created. The transctions are placed in thi block and considered confrimed.

    ![Imgur](https://i.imgur.com/Y9B6Xi1.png)
- In Bitcoin, for example, a reward is given to the first node that finds a specific
hash by hashing some information. The correct hash is a SHA-256 string made
by the transactions of the block, the previous block hash and the nonce, which
consists on having a leading number of zero bits. Two of the three parameters
of the SHA-256 hash are static, but one of them, the nonce, is selected by using
brute force, as it is the only known way to find the correct hash.
- Demo build blockchain simple taicoin

![Imgur](https://i.imgur.com/ni6puuP.png)

- `Problems with Proof-of-Work`:
    - There are three main problem:
        - `High Energy Consumption`: Mining requires highly specialized computer hardware to run the complicated algorithms. These specialized machines consume large amounts of power to run that increase costs. 
        - `51% attack`: A 51 percent attack, or majority attack, is a case when a user or a group of users control the majority of mining power.

        ![Imgur](https://i.imgur.com/Bar1O45.png)

        - `Miner Centralization`: There are a lot of the current Bitcoin mining being done in western China, where there is cheap excess hydro electricity.

### 6.2 Proof-of-Stake (PoS)

![Imgur](https://i.imgur.com/Ql3LZdK.jpg)

![Imgur](https://i.imgur.com/LA0wR0P.png)

- `What is Stake?` In crypto-terms, the stake is the cryptocurrency a user owns and pledges in order to partake in validation..
-  Proof of stake first idea was suggested on the bitcointalk forum back in 2011, but the first digital currency to use this method was Peercoin in 2012, together with ShadowCash, Nxt, BlackCoin, NuShares/NuBits, Qora and Nav Coin.
- Proof-of-Stake algorithms achieve consensus by requiring users to stake an amount of their tokens so as to have a chance of being selected to validate blocks of transactions, and get rewarded for doing so.
- There are two process in creating a new block:
    - The first element is `based on the number of stake they have`. Every validator must own a stake in the network. Validator will `stake their cryptocurrency coins` to ensure that next block is valid. 
        - Example, if a validator holds 10 coin and another holds 50 coins, the validator holding 50 coin will have a chance of 5 times to become the creator of the new block. If the block is valid, they will get rewarded. But they will lose stake.
        - The problem is the rich validator have many chance. The key here is to include a chance to the selection process so as to avoid a scenario where the richest users are always selected to validate transactions, consistently reap the rewards and grow richer and richer.
    - The second element is adding the random process to selection validator. The two most commonly used methods are `Randomised Block Selection` and `Coin Age Selection`.
        - In Randomised Block Selection, forgers are selected by looking for users with a combination of the lowest hash value and highest stakes.
        - The Coin Age Selection method chooses validators based on how long their tokens have been staked for. 
            - Coin age is calculated by multiplying the number of days the cryptocurrency coins have been held as stake by the number of coins that are being staked.
            - Coins must have been held for a minimum of 30 days before they can compete for a block. 
            - Once a user has forged a block, their coin age is reset to zero and then they must wait at least 30 days again before they can sign another block.
            - The user is assigned to forge the next block within a maximum period of 90 days, this prevents users with very old and large stakes from dominating the blockchain.

- Advantages of Proof-Of-Stake:
    - `Energy Efficiency`: Pos does not need to solve difficult math problems.
    - `Security`: Attackers must put their assets — their stake — on the line in order to attempt a 51% attack.
    - `Decentralizaton`
- Disadvantages of Proof-Of-Stake:
    - `Rich`: The more coins you can afford to buy, the more coins you can stake and earn.
    - `Verify on multiple chain`: Proof of Stake is that it allows people to verify transactions on multiple chains.
    - `nothing at stake` problem.

### 6.3 Delegated Proof-of-Stake (DPoS)

![Imgur](https://i.imgur.com/sTxAsKM.png)

- The delegated proof of stake algorithm allows token holders to elect witnesses. Witnesses act as validators of the blockchain, proposing blocks and verifying that transactions are correct. These witnesses serve a standard term length before being subject to elections again.
- As a reward for voting, voters will receive a share of the coin by the delegate. The share is based on the amount of coins they voted with relative to the coins held by other network members who voted for the same delegate.
- Only the top 100 delegate are paid for their service. The top 20 earn a regular salary. Because many want to become a delegate, there are hundreds of backup delegate.
- People’s vote strength is determined by how many tokens they hold. This means that people who have more tokens will influence the network more than people who have very few tokens.
- Election cycle length: How long the election cycle is. By default this is 1 week.
- If a delegate starts acting like an asshole, or stops doing a quality job securing the network, people in the community can remove their votes, essentially firing the bad actor. Voting is always ongoing.
![Imgur](https://i.imgur.com/GlkwBIi.png)

- Advantage of Delegate Proof of Stake: 
    - The DPoS mechanism reaches consensus `quickly` because there are far less people to reach consensus with (only the delegates).
    - `Better distribution of rewards`: Theoretically, people will elect only those delegates who give them the most rewards.
    - `Real-time voting security`: Voters can immediately detect malicious actions, and the malicious delegate can be voted out of the system.
    - `Energy efficiency`: DPoS consumes significantly less energy than PoW.
    - `Less hardware`: Participants don’t need costly, specialized equipment. A regular computer is powerful enough.

- Disavantage of Proof of Stake: 
    -` Delegates could form cartels`: Because only small group of people can decide on the validity of transaction of the network, `making the netword is centralized`. Delegates could start working together secretly, which would threaten the trust in the entire network.
    - `It's easier to organize an attack`: Because fewer people are in charge of keeping the network alive, it’s easier to organize a “51 percent” attack.
    - `The rich may get richer`: People’s vote strength is determined by how many tokens they have, which means that people who own more tokens will influence the network more than people who own very few.
    - `Apathy can kill`: Without a large number of engaged users, the system will not function as intended.
#### 6.4 Proof-of-Authority (PoA) 

![](https://media1.tenor.com/images/e1e5dc4d6f18c6f5aec8271d7bd60a33/tenor.gif?itemid=8387180)

```
It takes 20 years to build a reputation and 5 minutes to ruin it. If you think about that, you’ll do things differently.
```
- PoA consensus mechanism first conceived by Ethereum developers is an alternative version of the Proof of Stake (PoS), but instead of wealth at stake, `the authority’s identity` is put up front at stake (no anonymity). Mostly suited for private blockchain networks.
- Authorities have to earn the right to validate transactions by maintaining a squeaky clean reputation.
- A few conditions need to be satisfied:
    - `Identity must be true`: meaning there needs to be a standard and robust process of verifying that validators are indeed who they claim they are.
    - `Eligibility for staking identity should be difficult to obtain`: so that the right to be a validator becomes earned, valued, and unpleasant to lose.
    - `The procedure of establishing the authority needs to be the same for all validators`: to ensure that the network understands the process and can trust its integrity.

#### 6.5 Proof-of-Weight

![](https://media1.tenor.com/images/7baa930ba811fb7ef2399caddfe01491/tenor.gif?itemid=10133233)
- PoWeight is based around the Algorand, consensus model. On this network, Algorand assigns a weight to each user.
- The `weight of user is base on how much token they own in their account.
- The overall weighted fraction of the users are honest – usually two-thirds or greater – the network will remain secure. 

#### 6.6 Proof-of-Reputation 

![](https://cdn-images-1.medium.com/max/800/1*zhXNC-K8gl2q-c2CRyseOQ.gif)

- Similar to Proof of Authority.
- Proof of Reputation (PoR) consensus model depends on the `reputation` of the participants to keep the network secure.
- Once a company proves reputation and passes verification, they may be voted into the network as an authoritative node and at this point -> it operates like a Proof of Authority network (PoA).

#### 6.7 Proof of Elapsed Time
- PoET is a consensus mechanism algorithm that is often used on the permissioned blockchain networks to decide the mining rights or the block winners on the network.
- Each participating node in the network is required to wait for a randomly chosen time period, and the first one to complete the designated waiting time wins the new block. Each node in the blockchain network generates a random wait time and goes to sleep for that specified duration. Then the one to wake up first- the one with the shortest wait time-wakes up and commits a new block to the blockchain, then broadcast the necessary infomation to the peer network.
- The PoET network consensus needs to ensure two important factors:
    - The participating nodes genuinely select a time that is indeed random and not a shorter duration chosen purposely by the participants in order to win.
    - The winner has indeed completed the waiting time.

#### 6.8 Byzantine Fault Tolerance

![Imgur](https://i.imgur.com/3htTvwl.png)

- A fundamental problem in distributed computing and multi-agent systems is to achieve overall system reliability in the presence of a number of faulty processes. 

- Problem: [Understanding Blockchain Fundamentals, Part 1: Byzantine Fault Tolerance](https://medium.com/loom-network/understanding-blockchain-fundamentals-part-1-byzantine-fault-tolerance-245f46fe8419)

- In a P2P network, a consensus is achieved if the loyal, or non-faulty nodes, achieve a unanimous agreement on their decision.
- Several cryptocurrency protocols use some version of BFT to come to consensus:
    - `Practical Byzantine Fault Tolerance (PBFT)`: 

    ![Imgur](https://i.imgur.com/NE4krNo.png)

    Lamport’s algorithm is a recursive definition, with a base case for m=0, and a recursive step for m > 0:
    - `Algorithm OM(0)`:
        - The general sends his value to every lieutenant.
        - Each lieutenant uses the value he receives from the general.
    - `Algorithm OM(m), m > 0`:
        - The general sends his value to each lieutenant.
        - For each i, let vi be the value lieutenant i receives from the general. Lieutenant i acts as the general in Algorithm OM(m-1) to send the value vi to each of the n-2 other lieutenants.
        - For each i, and each j≠i, let vi be the value lieutenant i received from lieutenant j in step 2 (using Algorithm (m-1)). Lieutenant i uses the value majority (v1, v2, … vn).<>

    - All of the nodes in the pBFT model are ordered in a sequence with one node being the primary node (leader) and the others referred to as the backup nodes.
    - The goal is for all of the honest nodes to come to an agreement of the state of the system throught a majority.
    - Nodes must verify that the message was not modified during transmission.
    - The algorithm can reach consensus as long as 2/3 of the actors are honest. If the traitors are more than 1/3, consensus is not reached
    - The phases are below:
        - A client sends a request to the leader node to invoke a service operation.
        - The leader node multicasts the request to the backup nodes.
        - The nodes execute the request and then send a reply to the client.
        - The client awaits f + 1 (f represents the maximum number of nodes that may be faulty) replies from different nodes with the same result. This result is the result of the operation.

![Imgur](https://i.imgur.com/JcroYFd.png)

![Imgur](https://i.imgur.com/r0QzfQw.png)

![Imgur](https://i.imgur.com/DKf6Axe.png)

![Imgur](https://i.imgur.com/GihYxEJ.png)


#### 6.9 One-phase commit
- Distributed One-phase Commit is the simplest commit protocol.
- Distributed transactions:
    - Have multiple servers
    - All servers either be commited or aborted.
- Steps in commit:
    - After each slave node has locally completed its transaction, it sends a “DONE” message to the coordinator node.
    - The slaves wait for “Commit” or “Abort” message from the coordinator node. This waiting time is called `window of vulnerability`.
    - When the coordinator node receives “DONE” message from each slave node, it makes a decision to commit or abort. This is called the commit point. Then, it sends this message to all the slaves node.
    - On receiving this message, a slave either node commits or aborts and then sends an acknowledgement message to the coordinator node.

- The server cannot abort part of a transaction:
    - When the server crashed and has been replaced.
    - When deadlock has been detected and resolved.

- The problem:
    - When part aborted, the whole transaction may have to be
aborted.

#### 6.11 Three-phase commit

![Imgur](https://i.imgur.com/k4fKt6Al.png)

- The three-phase commit protocol is said to be non-blocking.
- 3PC splits the prepare state in two: pre-commit and commited.
- 3PC as non-blocking does not mean that the participants are not blocked in processing.  The database has to start a local transaction and put locks on appropriate places when process the transaction and when agree to commit. Thus other operations could be blocked by this effort and needs to wait till the whole 3PC ends.

`The non-blocking means that protocol can proceed despite of existence of failures.`

![Imgur](https://i.imgur.com/ztq0WrU.png)

- Purpose: `let every participant know the state of the result of the vote so that state can be recovered if anyone dies.`
- When any participant is in the pre-commit state the transactions is about to commit - participants can be sure that coordinator decided to commit before. 
- When there is no participant in pre-commit state the transaction is about to abort - participants know it’s possible that coordinator decided to abort.

- Solutions solve problems:
    - The failure of participant is observed by timeouting the coordinator while waiting the participant respons:
        - If timeout occurs for waiting state we know that there are some participants in initial state or/and waiting state. Coordinator commands to abort.
        - If timeout occurs for pre-commit state we know that there are some participants in waiting state or/and in pre-commit state. Coordinator commands to abort.
        - If there is a participant which does not receive the abort message we are fine as upon the recovery, the participant decides depending on the state of other participants.

    - If timeout occurs there is need to find a new coordinator which verifies what is the state of the participants:
        - The new coordinator is state:
            -  Already committed:
                - That means that every other participant has received a `Prepare to Commit`.
                - Some participants may have committed.
                - Send Commit message to all participants (just in case they didn’t get it).
            - Not committed but received a Prepare message:
                - That means that all participants agreed to commit; some may have committed.
                - Send `Prepare to Commit` message to all participants (just in case they didn’t get it).
                - Wait for everyone to acknowledge; then `commit`.
            - Not yet received a Prepare message:
                - This means no participant has committed; some may have agreed.
                - Transaction can be `aborted` or the commit protocol can be `restarted`
- Disavantage:
    - Cost
    - Problems when the network gets partitioned:
        - Partition A: nodes that received Prepare message
            - Recovery coordinator for A: allows commit
        - Partition B: nodes that did not receive Prepare message
            - Recovery coordinator for B: aborts.
        
        `But when the network merges back, the system is inconsistent`
    - Not good when a crashed coordinator recovers:
        - It needs to find out that someone took over and stay quiet.
        - Otherwise it will mess up the protocol, leading to an inconsistent state.
    - Suppose
        - A coordinator sent a Prepare message to all participants.
        - All participants acknowledged the message.
        - BUT the coordinator died before it got all acknowledgements.

## Reference


[MSMQ](http://www.simpleorientedarchitecture.com/msmq-basics/)

[Understanding Modern Service Discovery with Docker](http://progrium.com/blog/2014/07/29/understanding-modern-service-discovery-with-docker/)

[Service Discovery in a Microservices Architecture](https://www.nginx.com/blog/service-discovery-in-a-microservices-architecture/)

[Giới thiệu về Enterprise Service Bus](https://huongdanjava.com/vi/gioi-thieu-ve-enterprise-service-bus.html)

[Giới thiệu Oracle Enterpise Service Bus](https://viblo.asia/p/gioi-thieu-oracle-enterpise-service-bus-ZjlealazGqJ)

[The History of Pets vs Cattle and How to Use the Analogy Properly](http://cloudscaling.com/blog/cloud-computing/the-history-of-pets-vs-cattle/)

[CAP Theorem and Distributed Database Management Systems](https://towardsdatascience.com/cap-theorem-and-distributed-database-management-systems-5c2be977950e)

[Why you need NoSQL](https://www.researchgate.net/figure/CAP-theorem-concept-5-II-WHY-YOU-NEED-NOSQL-The-first-reason-to-use-NoSQL-is-because_fig2_323309389)

[Consistency and Replication](http://csis.pace.edu/~marchese/CS865/Lectures/Chap7/Chapter7fin.htm)

[A Look at Conflict-Free Replicated Data Types (CRDT)](https://medium.com/@istanbul_techie/a-look-at-conflict-free-replicated-data-types-crdt-221a5f629e7e)

[Conflict-free replicated data type](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)

[Conflict-free Replicated Data Types](https://pages.lip6.fr/Marc.Shapiro/papers/RR-7687.pdf)

[When to use a CRDT-based database](https://www.infoworld.com/article/3305321/nosql/when-to-use-a-crdt-based-database.html?page=2)

[A comprehensive study of Convergent and Commutative Replicated Data Types](https://hal.inria.fr/file/index/docid/555588/filename/techreport.pdf)

[Ethereum tutorial #01 — What is a blockchain and its purpose?](https://medium.com/coinmonks/what-is-a-blockchain-and-its-purpose-42f462e017ed)

[Proof-Of-Work, Explained](https://www.investinblockchain.com/proof-of-work-explained/)

[Proof of Work vs Proof of Stake: Basic Mining Guid](https://blockgeeks.com/guides/proof-of-work-vs-proof-of-stake/)

[SavjeeTutorials Github](https://github.com/SavjeeTutorials/SavjeeCoin)

[What is Proof of Stake?](https://hackernoon.com/what-is-proof-of-stake-8e0433018256)

[Blockchain-basics](https://lisk.io/academy/blockchain-basics)

[Explain Delegated Proof of Stake Like I’m 5](https://hackernoon.com/explain-delegated-proof-of-stake-like-im-5-888b2a74897d)

[Proof of Authority: consensus model with Identity at Stake](https://medium.com/poa-network/proof-of-authority-consensus-model-with-identity-at-stake-d5bd15463256)

[Proof of Reputation](https://medium.com/gochain/proof-of-reputation-e37432420712)

[Proof of History — A clock for blockchain](https://medium.com/@anatolyyakovenko/proof-of-history-a-decentralized-clock-for-blockchain-9d245bd5abb3)

[ConsensusPedia: An Encyclopedia of 30 Consensus Algorithms](https://hackernoon.com/consensuspedia-an-encyclopedia-of-29-consensus-algorithms-e9c4b4b7d08f)

[Consensus Protocols That Meet Different Business Demands](https://blockchain.intellectsoft.net/blog/consensus-protocols-that-meet-different-business-demands/#Byzantine_Fault_Tolerance)

[The Byzantine Generals Problem](https://marknelson.us/posts/2007/07/23/byzantine.html)

[Distributed DBMS - Commit Protocols](https://www.tutorialspoint.com/distributed_dbms/distributed_dbms_commit_protocols.htm)

[One-Phase-Commit: Fast Transactions For In-Memory Caches](https://dzone.com/articles/one-phase-commit-fast)

[Consensus Protocols: Two-Phase Commit](https://www.the-paper-trail.org/post/2008-11-27-consensus-protocols-two-phase-commit/)

[Three-phase commit protocol](https://developer.jboss.org/wiki/Three-phaseCommitProtocol)

[Distributed Systems](https://www.cs.rutgers.edu/~pxk/417/notes/content/11-transactions-slides.pdf)
