"use client"; // This ensures the page is client-side rendered

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import type { CreateSubscriptionActions, OnApproveData, OnApproveActions } from "@paypal/paypal-js";
import toast, { Toaster } from "react-hot-toast";

// Extend the Window interface to include ReactNativeWebView
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
//.

export default function Home() {


  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscription = (
    data: unknown,
    actions: CreateSubscriptionActions
  ) => {
    console.log("Starting subscription creation...");
    console.log("Plan ID:", process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID);
    return actions.subscription.create({
      plan_id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
    });
  };

  const onApprove = async (data: OnApproveData, actions: OnApproveActions): Promise<void> => {
    console.log("onApprove triggered with data:", data);

    if (!data.subscriptionID) {
      console.error("Subscription ID is missing");
      const message = JSON.stringify({
        type: "SUBSCRIPTION_ERROR",
        error: "Subscription ID is missing",
      });

      if (window.ReactNativeWebView) {
        console.log("Posting error message to WebView:", message);
        // If in a WebView, post the message
        window.ReactNativeWebView.postMessage(message);
      }
      toast.error("Error: Subscription ID is missing");
      return;
    }
    setIsProcessing(true);
    console.log("Subscription successful. Subscription ID:", data.subscriptionID);
    //ch

    // Send the subscription ID back to the React Native app
    const message = JSON.stringify({
      type: "SUBSCRIPTION_SUCCESS",
      subscriptionID: data.subscriptionID,
    });

    // Show success toast
    toast.success("Subscription successful! Redirecting to app...");

    // If in a WebView, post the message
    if (window.ReactNativeWebView) {
      console.log("Posting success message to WebView:", message);
      window.ReactNativeWebView.postMessage(message);
    } else {
      // If in a browser, redirect back to the app using a deep link
      console.log("Redirecting to app with deep link...");
      setTimeout(() => {
        window.location.href = `kingdomcomicsapp://payment-callback?data=${encodeURIComponent(message)}`;
        console.log("Subscription ID:", data.subscriptionID);
      }, 2000); // Optional delay before redirecting
    }
    // // console.log("Subscription ID:", data.subscriptionID);
    // alert(`Subscription successful! Subscription ID: ${data.subscriptionID}`);
  };

  const onError = (err: Record<string, unknown>) => {
    console.log("onError triggered with error:", err);
    const errorMessage = err.message || "An unknown error occurred";

    const message = JSON.stringify({
      type: "SUBSCRIPTION_ERROR",
      error: errorMessage,
    });

    if (window.ReactNativeWebView) {
      console.log("Posting error message to WebView:", message);
      window.ReactNativeWebView.postMessage(message);
    }

    toast.error(`Subscription failed: ${errorMessage}`);
    // window.ReactNativeWebView?.postMessage(message);
    // alert(`Error: ${errorMessage}`);
  };

  const onCancel = (data: unknown) => {
    console.log("User canceled the subscription flow:", data);
    toast.error("Subscription canceled by user");
  };

  const onClick = () => {
    console.log("PayPal button clicked, initiating subscription...");
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
      <Toaster position="top-center" reverseOrder={false} />
      <h2>Subscribe to Kingdom Comics</h2>
      {isProcessing ? (
        <div style={{ margin: "20px 0", fontSize: "16px", color: "#555" }}>
          Processing your subscription, please wait...
        </div>
      ) : null}
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
          onCancel={onCancel}
          onClick={onClick}
          style={{ layout: "vertical", label: "subscribe" }}
          disabled={isProcessing}
        />
      </PayPalScriptProvider>
    </div>
  );
}