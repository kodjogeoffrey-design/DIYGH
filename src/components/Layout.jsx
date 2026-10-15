import React from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BuildBar from "@/components/BuildBar";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-[72px] md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BuildBar />
    </div>
  );
}