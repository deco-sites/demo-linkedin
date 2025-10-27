import { useEffect, useState } from "preact/hooks";
import { state as storeState } from "../../sdk/context.ts";
import { clx } from "site/sdk/clx.ts";

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

  return (
    <a
      href={isLoggedIn ? "/account" : "/login"}
      class={clx(
        "background text-[14px] flex justify-center items-center h-[40px] px-3 rounded-lg",
        loading && "pointer-events-none",
      )}
    >
      {isLoggedIn ? "Account" : "Sign In"}
    </a>
  );
}
