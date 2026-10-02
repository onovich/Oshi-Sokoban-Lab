# oct-m02 倚埠

Temp source/test/audit frozen candidate, no AI or author acceptance. IDlab-oct-m02, exportoctM02, groupoct-goal, targetD4 design-target, hash6b97ddd4. 4×3clear; P(0,1), walls(0,0),(0,2),(3,2); real single Block(2,0), movable single Goal(1,1), neither complete. No numbers/Fake/Rain; a decorative mismatched staticGoal was removed during exploration.

13input routeRDRURLDLURRUL,4pushes (3Goal+1Block),120states in real-move input BFS. First placeGoal under Block, approach it vertically so Block preventsGoal'supwardpush and enables crossing; enter new side; retrieveGoal left and then up to the future destination; finally pushBlockleft. Shared resource is the taskBlock itself determiningGoal'spermission before becoming the task to transport. Not enlargement/rotation ofM01; M01 uses boundary and multi-cell internalcontact, M02 requires opposing approach directions and the taskBlock's occupancy.

Proof: banGoal-crossed exhausts39statesunsolved; banreturnGoal2,1→1,1 exhausts66unsolved. Both officialsolver conditions individually proven-unsolved. Local causal test atprefixRDR: up→goal-crossed withBlock; same input after removingBlock from that local state→goal-pushed2,1→2,0. This local diagnostic does not claim deletingBlock creates a playable alternatelevel.

Decouple onlywall(3,2): noGoal-crossing solutionRRDRULLUR,9inputs,96states;the test separately replays and runs forbiddencondition solver. ObviousRR overpushesGoal to rightboundary and subsequent complete realgraph has no solution; this is not asserted from shortestroute alone.

Seal each ordinaryemptyfloor(1,0),(3,0),(2,1),(3,1),(1,2),(2,2): no solution,28/33/29/28/36/51states. Remove soleGoal: no win. All normalfloor proof-critical, no decorative/redundantspace retained. Budget40,000tests /30,000exploration; none exhausted, exhaustion throwsunknown. Keyplayer+Blockpositions+Goalpositions sufficient for these staticclearboards.

TDD missingmodule red→maproutegreen→sixcausal/contrast/error/mutation tests green. Copyoct-m02.ts and.test.ts tosrc/levels/lab directly. Temp command asM01 withoct-m02.test.ts. Auditaudit-m02.mjs directly imports finaldraft and prints hash, actual solverreplayand events. Detailedexploration inexplore-number.mjs includesfinalvariant output. No course/git writes bydesigner.

Risk: compact13-input structure may beD3–4 rather thantargetD4; permit it as condition-actionpractice, not proof of highdifficulty. Need UI/tester verify movableGoal and Block relation is staticallylegible. Similar mechanism vocabulary toborrowedGoal classics is intentional; subsequent cards must add changingresourceconditions rather than repeat this crossing.
