"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/CartProvider";

export function ClearCart() {
  const { clear } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    clear();
  }, [clear]);
  return null;
}
