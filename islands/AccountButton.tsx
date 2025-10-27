import { useEffect, useState } from "preact/hooks";
import { state as storeState } from "../sdk/context.ts";

export default function AccountButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const loading = storeState.loading.value;

  useEffect(() => {
    // Subscribe to user changes
    const updateUserState = () => {
      const user = storeState.user.value;
      setIsLoggedIn(user !== null);
    };

    // Initial update
    updateUserState();

    // Subscribe to user signal changes
    const unsubscribe = storeState.user.subscribe(updateUserState);

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <span class="background text-[14px] flex justify-center items-center h-[40px] px-3 rounded-lg loading loading-spinner" />
    );
  }

  return (
    <a
      href={isLoggedIn ? "/account" : "/login"}
      class="background text-[14px] flex justify-center items-center h-[40px] px-3 rounded-lg"
    >
      {isLoggedIn ? "Account" : "Sign In"}
    </a>
  );
}
