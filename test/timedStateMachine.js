import increaseTime, { duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import expectThrow from './helpers/expectThrow';

const StateMachineLib = artifacts.require('StateMachineLib');
const TimedStateMachineMock = artifacts.require('TimedStateMachineMock');

contract('TimedStateMachine', accounts => {
  let timedStateMachine;
  let invalidState = 'invalid';
  const state0 = 'STATE0';
  const state1a = 'STATE1A';
  const state1b = 'STATE1B';
  const state2 = 'STATE2';
  const state3 = 'STATE3';

  beforeEach(async () => {
    const stateMachineLib = await StateMachineLib.new();
    TimedStateMachineMock.link('StateMachineLib', stateMachineLib.address);
    timedStateMachine = await TimedStateMachineMock.new();
  });

   
  it('should not be possible to set the start time for an invalid state', async () => {
    const timestamp = (await latestTime()) + duration.weeks(1);
    await expectThrow(timedStateMachine.setStateStartTimeHelper(invalidState, timestamp));
  });

  it('should not be possible to set a start time lower than the current one', async () => {
    const timestamp = (await latestTime()) - duration.weeks(1);
    await expectThrow(timedStateMachine.setStateStartTimeHelper(state0, timestamp));
    await expectThrow(timedStateMachine.setStateStartTimeHelper(state1a, timestamp));
    await expectThrow(timedStateMachine.setStateStartTimeHelper(state2, timestamp));
    await expectThrow(timedStateMachine.setStateStartTimeHelper(state3, timestamp));
  });

  it('should be possible to set a start time', async () => {
    const timestamp = (await latestTime()) + duration.weeks(1);

    await timedStateMachine.setStateStartTimeHelper(state1a, timestamp);

    const _timestamp = await timedStateMachine.getStateStartTime.call(state1a);

    assert.equal(timestamp, _timestamp);

  });

  it('should transition to the next state if the set timestamp is reached', async () => {
    const timestamp = (await latestTime()) + duration.weeks(1);

    await timedStateMachine.setStateStartTimeHelper(state1a, timestamp);

    await increaseTime(duration.weeks(2));

    await timedStateMachine.conditionalTransitions();

    let currentState = web3.toUtf8(await timedStateMachine.getCurrentStateId.call());

    assert.equal(currentState, state1a);

    await timedStateMachine.conditionalTransitions(); //calling it again should not affect the expected result

    currentState = web3.toUtf8(await timedStateMachine.getCurrentStateId.call());

    assert.equal(currentState, state1a);

  });
});
