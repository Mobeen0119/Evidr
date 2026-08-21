import { NextResponse } from "next/server";
import { demoCase } from "@/lib/investigation/demo-data";

export async function GET() {
  return NextResponse.json({ case: demoCase });
}
