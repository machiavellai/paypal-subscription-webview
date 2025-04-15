"use client"; // This ensures the page is client-side rendered

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import type { CreateSubscriptionActions, OnApproveData, OnApproveActions } from "@paypal/paypal-js";
// Extend the Window interface to include ReactNativeWebView
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export default function Home() {

  const createSubscription = (
    data: unknown,
    actions: CreateSubscriptionActions
  ) => {
    return actions.subscription.create({
      plan_id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
    });
  };

  const onApprove = async (data: OnApproveData, actions: OnApproveActions): Promise<void> => {
    if (!data.subscriptionID) {
      const message = JSON.stringify({
        type: "SUBSCRIPTION_ERROR",
        error: "Subscription ID is missing",
      });
      window.ReactNativeWebView?.postMessage(message);
      alert("Error: Subscription ID is missing");
      return;
    }

    // Send the subscription ID back to the React Native app
    const message = JSON.stringify({
      type: "SUBSCRIPTION_SUCCESS",
      subscriptionID: data.subscriptionID,
    });

    // If in a WebView, post the message
    if (window.ReactNativeWebView) {

      window.ReactNativeWebView.postMessage(message);
    } else {
      // If in a browser, redirect back to the app using a deep link
      window.location.href = `kingdomcomicsapp://payment-callback?data=${encodeURIComponent(message)}`;
      console.log("Subscription ID:", data.subscriptionID);
    }

    // console.log("Subscription ID:", data.subscriptionID);
    alert(`Subscription successful! Subscription ID: ${data.subscriptionID}`);
  };

  const onError = (err: Record<string, unknown>) => {
    const errorMessage = err.message || "An unknown error occurred";
    const message = JSON.stringify({
      type: "SUBSCRIPTION_ERROR",
      error: errorMessage,
    });
    window.ReactNativeWebView?.postMessage(message);
    alert(`Error: ${errorMessage}`);
  };

  // const onError = (err: Error) => {
  //   const message = JSON.stringify({
  //     type: "SUBSCRIPTION_ERROR",
  //     error: err.message,
  //   });
  //   window.ReactNativeWebView?.postMessage(message);
  //   alert(`Error: ${err.message}`);
  // };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Subscribe to Kingdom Comics</h2>
      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
          vault: true,
          intent: "subscription",
        }}
      >
        <PayPalButtons
          createSubscription={createSubscription}
          onApprove={onApprove}
          onError={onError}
          style={{ layout: "vertical", label: "subscribe" }}
        />
      </PayPalScriptProvider>
    </div>
  );
}