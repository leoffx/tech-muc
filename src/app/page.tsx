"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const tickets = useQuery(api.tickets.get);

  return (
    <main className="justify-centertext-white flex min-h-screen flex-col items-center">
      <h1>Tech MUC</h1>
      {tickets?.map(({ _id, title }) => (
        <div key={_id}>{title}</div>
      ))}
    </main>
  );
}
