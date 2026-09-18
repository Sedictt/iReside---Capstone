---
trigger: always_on
---

- we only have landlord and tenant, we dont have Admin.
- Make sure it 100% accurate


- the data flow diagram must adhere to gane and sarson's model
- the data flow diagram must flow downwards (hierarchical)
- the data flow diagram must must be consistent across different levels (from level 0 to level 1), 

Gane-Sarson DFD Symbols

Four basic symbols are used in data flow diagrams as shown in the Table illustrated below:

    double square
    arrow
    rectangle with rounded corners
    open-ended rectangle (closed on the left side and open-ended on the right)



Core Rules of Data Flow

Mandatory Processing: All data flows must begin or end at a process. Data cannot change or move passively on its own without a processing step.

No Entity-to-Entity Flows: External entities cannot send data directly to another external entity without a process in between.

No Direct Store-to-Store/Entity Flows: Data cannot move directly between two data stores, from an entity to a data store, or from a data store back to an entity. A process must always mediate these transfers.

Process Requirements: Every process must have at least one input data flow and one output data flow. Processes cannot be dead ends or spontaneous generation points (no "black holes" or "miracles").

Data Store Requirements: Every data store must have at least one data flow entering or leaving it (connected via a process to handle reads or writes).

DFD Balancing Rule: Every process, data flow, data store, and external entity introduced in a lower-level DFD must have a corresponding parent or logical representation in its higher-level DFD. Lower-level diagrams may provide more detail, but they must not introduce unrelated processes or data flows that do not originate from the parent process.