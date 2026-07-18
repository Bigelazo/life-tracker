import { isOwnerEmail } from "./allowlist";

export type SignInDecisionInput = {
  provider: string | null | undefined;
  email: string | null | undefined;
};

export const TEST_OWNER_PROVIDER_ID = "test-owner";

export function shouldAllowSignIn({
  provider,
  email,
}: SignInDecisionInput): boolean {
  if (provider === TEST_OWNER_PROVIDER_ID) return true;
  if (provider !== "google") return false;
  return isOwnerEmail(email);
}