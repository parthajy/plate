import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';

// RevenueCat SDK initialisation. Call once at app boot — calling more than
// once is a no-op on subsequent calls (RC tracks its own configured state).
//
// The keys are public SDK keys, designed to ship in the client bundle.
// They are NOT secrets — they only let the SDK reach RC's billing proxy.

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

let configured = false;

export function initRevenueCat(): void {
  if (configured) return;

  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!apiKey) {
    // Don't crash if the dev hasn't set the env var yet — purchases will
    // simply be unavailable. The monetisation flag is the source of truth
    // for whether the paywall is shown.
    if (__DEV__) {
      console.warn(
        `[RevenueCat] No ${Platform.OS} API key set. ` +
          `Set EXPO_PUBLIC_REVENUECAT_${Platform.OS.toUpperCase()}_KEY in .env.`,
      );
    }
    return;
  }

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.WARN);
    Purchases.configure({ apiKey });
    configured = true;
  } catch (err) {
    // A bad/test key in production will throw here. Don't crash the app —
    // RevenueCat is best-effort; the paywall is the only thing that depends
    // on it and that's hidden behind a flag until v1.1.
    if (__DEV__) console.warn('[RevenueCat] configure failed', err);
  }
}

export function isRevenueCatConfigured(): boolean {
  return configured;
}

/**
 * Tell RevenueCat which app user this device is currently signed in as.
 * Idempotent — safe to call repeatedly with the same id. Call after every
 * successful sign-in so subscriptions stick to the user across reinstalls
 * and devices, not to the anonymous device id RC issues by default.
 */
export async function identifyToRevenueCat(userId: string): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] logIn failed', err);
  }
}

/**
 * Detach the current user from RC. Call on sign-out / account-delete so the
 * next anonymous session doesn't inherit the previous user's entitlements.
 */
export async function resetRevenueCatIdentity(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (err) {
    // logOut throws if already anonymous — that's fine, ignore.
    if (__DEV__) console.warn('[RevenueCat] logOut noop', err);
  }
}

// Entitlement identifier we set up in the RC dashboard. Single source of
// truth — change here if you ever rename it in the RC project.
export const PRO_ENTITLEMENT = 'pro';

/**
 * Fetch the current "default" offering (set in the RC dashboard) and return
 * the monthly + annual packages. Returns null if RC isn't configured or
 * the offering hasn't been published yet — caller should fall back to a
 * "subscriptions not available" message instead of crashing.
 */
export async function fetchProOfferings(): Promise<{
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
} | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return null;
    return {
      monthly: current.monthly ?? null,
      annual: current.annual ?? null,
    };
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] fetchProOfferings failed', err);
    return null;
  }
}

/**
 * Run the native purchase sheet for the given package. Returns true if the
 * purchase grants the Pro entitlement; throws otherwise (caller surfaces
 * error to user). Cancellation throws with `userCancelled: true`.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  if (!configured) throw new Error('Purchases not configured');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return !!customerInfo.entitlements.active[PRO_ENTITLEMENT];
}

/**
 * Restore purchases for the current Apple ID / Google account. Used by the
 * "Restore purchases" link Apple requires on any paywall.
 */
export async function restorePurchases(): Promise<boolean> {
  if (!configured) return false;
  const customerInfo = await Purchases.restorePurchases();
  return !!customerInfo.entitlements.active[PRO_ENTITLEMENT];
}
