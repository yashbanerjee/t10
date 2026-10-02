import { NextResponse } from "next/server";

export function success<T>(data: T, message = "Success", init?: ResponseInit) {
  return NextResponse.json({ success: true, data, message }, init);
}

export function failure(message: string, status = 400, errors?: unknown) {
  return NextResponse.json({ success: false, message, ...(errors ? { errors } : {}) }, { status });
}

