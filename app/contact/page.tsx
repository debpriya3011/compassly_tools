"use client";
import { useState } from "react";
export default function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <main className="page prose">
      <p className="eyebrow">CONTACT</p>
      <h1>Send feedback</h1>
      <p>Found a bug or have a tool idea? We’d love to hear it.</p>
      {sent ? (
        <p className="success">Thanks — your message has been recorded.</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <input required placeholder="Your name" />
          <input required type="email" placeholder="Email address" />
          <textarea required placeholder="Message" />
          <button>Send message</button>
        </form>
      )}
    </main>
  );
}
