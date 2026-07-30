import {
	createParticipantRecords,
	registrationApiErrorMessage,
	type BatchSubmitResult,
	type SubmitRegistrationInput,
} from "@/lib/registration/orval";
import { useMutation } from "@tanstack/react-query";

/** Public registration create — single or create-team batch. */
export function useSubmitRegistration() {
	return useMutation({
		mutationKey: ["registration", "submit"],
		mutationFn: async (
			input: SubmitRegistrationInput,
		): Promise<BatchSubmitResult> => createParticipantRecords(input),
		meta: {
			errorMessage: registrationApiErrorMessage,
		},
	});
}

export { registrationApiErrorMessage };
