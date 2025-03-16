
import React from "react";
import { Hero } from "@/components/Hero";
import WebSocketDemo from "@/components/WebSocketDemo";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <div className="py-12 px-4">
        <h2 className="text-2xl font-bold text-center mb-8">WebSocket Demo</h2>
        <WebSocketDemo />
      </div>
    </div>
  );
};

export default Index;
