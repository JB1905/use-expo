import { renderHook, act } from '@testing-library/react-hooks';
import * as Battery from 'expo-battery';
import { useBatteryState } from '../src';

const DATA = 0;
const GET = 1;

it('returns data and get callback when mounted', () => {
	const hook = renderHook(() => useBatteryState({ get: false, listen: false }));

	expect(hook.result.current[DATA]).toBeUndefined();
	expect(hook.result.current[GET]).toBeInstanceOf(Function);
});

it('updates data with get callback', async () => {
	jest.spyOn(Battery, 'getBatteryStateAsync').mockResolvedValue(Battery.BatteryState.FULL);

	const hook = renderHook(() => useBatteryState({ get: false, listen: false }));
	await act(() => hook.result.current[GET]());

	expect(hook.result.current[DATA]).toBe(Battery.BatteryState.FULL);
});

describe('default behavior', () => {
	it('gets battery state when mounted', async () => {
		jest.spyOn(Battery, 'getBatteryStateAsync').mockResolvedValue(Battery.BatteryState.UNPLUGGED);

		const hook = renderHook(() => useBatteryState({ listen: false }));
		await hook.waitForNextUpdate();

		expect(hook.result.current[DATA]).toBe(Battery.BatteryState.UNPLUGGED);
		expect(Battery.getBatteryStateAsync).toBeCalled();
	});

	it('listens to battery state when mounted', async () => {
		const subscription = { remove: jest.fn() };
		const listener = jest.spyOn(Battery, 'addBatteryStateListener').mockReturnValue(subscription);

		const hook = renderHook(() => useBatteryState({ get: false }));
		const handler = listener.mock.calls[0][0];
		act(() => handler({ batteryState: Battery.BatteryState.UNKNOWN }));

		expect(hook.result.current[DATA]).toBe(Battery.BatteryState.UNKNOWN);
		expect(Battery.addBatteryStateListener).toBeCalled();
	});
});

describe('event listener', () => {
	it('subscribes when mounted', () => {
		const listener = jest.spyOn(Battery, 'addBatteryStateListener');

		renderHook(() => useBatteryState({ get: false, listen: true }));
		expect(listener).toBeCalled();
	});

	it('unsubscribes when unmounted', () => {
		const subscription = { remove: jest.fn() };
		jest.spyOn(Battery, 'addBatteryStateListener').mockReturnValue(subscription);

		const hook = renderHook(() => useBatteryState({ get: false, listen: true }));
		hook.unmount();

		expect(subscription.remove).toBeCalled();
	});
});
