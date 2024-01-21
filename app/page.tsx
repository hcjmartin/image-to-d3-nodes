"use client";
import Graph from "./components/graph";
import { useRef, useState } from "react";

export default function Home() {
  const [nightmode, setNightmode] = useState(false);

  var windowSize = useRef([100, 100]);
  var isMobile = false;

  if (typeof window !== "undefined") {
    windowSize.current = [window.innerWidth, window.innerHeight];

    let userAgent = navigator.userAgent.toLowerCase();
    isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(
      userAgent
    );
  }

  console.clear();
  console.log(
    "/// Hey! Harry here. This silly little experiment converts a local png to a d3 graph of nodes."
  );
  console.log(
    "/// Why? I wanted to do something different for my Canva application..."
  );
  console.log("/// Is it super fancy? No. Did I have fun making it? Yes!");
  console.log("/// Repo: https://github.com/hcjmartin/image-to-d3-nodes/");
  console.log("/// Message me here https://www.linkedin.com/in/hcjmartin/");

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-between p-24"
      style={{ backgroundColor: nightmode ? "black" : "white" }}
    >
      <div
        style={{
          display: "block",
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
        }}
      >
        <Graph
          width={windowSize.current[0]}
          height={windowSize.current[1]}
          imageToConvertPath="/images/canvalogosm2.png"
          splashImagePath="/images/harry256li.png"
          splashClickLink="https://www.linkedin.com/in/hcjmartin/"
          isMobile={isMobile}
        ></Graph>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          margin: 24,
          bottom: 0,
          right: 0,
          alignItems: "end",
          flexDirection: "column",
          textAlign: "right",
        }}
      >
        <p style={{ color: nightmode ? "white" : "black" }}>
          Move your mouse over the graphic, help me make a splash at Canva 😄{" "}
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          margin: 24,
          top: 0,
          right: 0,
          marginLeft: 6,
          width: 24,
          height: 24,
          borderRadius: 10,
          backgroundColor: nightmode ? "white" : "black",
        }}
        onClick={() => setNightmode(!nightmode)}
      />
    </main>
  );
}
