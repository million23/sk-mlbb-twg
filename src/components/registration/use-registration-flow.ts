import {
	createInitialState,
	reduce,
	type Action,
	type RegistrationDraft,
} from "@/lib/registration/flow";
import { useReducer } from "react";

export function useRegistrationFlow(initial?: Partial<RegistrationDraft>) {
	const [state, dispatch] = useReducer(
		(s: RegistrationDraft, a: Action) => reduce(s, a),
		undefined,
		() => createInitialState(initial),
	);
	return { state, dispatch };
}

export type RegistrationFlowApi = ReturnType<typeof useRegistrationFlow>;
