import {
	createParticipantRecord,
	registrationApiErrorMessage,
	type SubmitRegistrationInput,
} from "@/lib/registration/orval";
import { useMutation } from "@tanstack/react-query";

/** Public registration create — Orval participants path with multipart body. */
export function useSubmitRegistration() {
	return useMutation({
		mutationKey: ["registration", "submit"],
		mutationFn: async (input: SubmitRegistrationInput) =>
			createParticipantRecord(input),
		meta: {
			errorMessage: registrationApiErrorMessage,
		},
	});
}

export { registrationApiErrorMessage };
