"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import {
  IPixelColourData,
  getPixelsFromFile,
  getPixelsFromPath,
  pixelDataToColors,
} from "../services/pixelHelpers";

interface MyD3ComponentProps {
  width: number;
  height: number;
  isMobile: boolean;
  imageToConvertPath: string;
  splashImagePath: string;
  splashClickLink: string;
  fileDataUrl?: string;
}

interface CustomNode extends d3.SimulationNodeDatum {
  r: number; // radius
  homeX: number; // target home x position
  homeY: number; // target home y position
  color: string; // node colour
  fx?: number | null; // fixed x position
  fy?: number | null; // fixed y position
  x: number; // x position
  y: number; // y position
  alphaValue?: number;
}

function D3NodeGraphic(props: MyD3ComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pixelColourData, setPixelColourData] = useState<IPixelColourData>();
  const [nodeData, setNodeData] = useState<CustomNode[]>();
  const [splashImageLoaded, setSplashImageLoaded] = useState<boolean>(false);

  const width = props.width;
  const height = props.height;

  const openInNewTab = (url: string) => {
    window.open(url, "_blank");
  };

  useEffect(() => {
    if (props.fileDataUrl) {
        getPixelsFromFile(props.fileDataUrl).then((pixelArray) => {
            setPixelColourData(pixelDataToColors(pixelArray));
          });
    } else {
      getPixelsFromPath(props.imageToConvertPath).then((pixelArray) => {
        setPixelColourData(pixelDataToColors(pixelArray));
      });
    }
  }, [props.imageToConvertPath, props.fileDataUrl]);

  useEffect(() => {
    if (pixelColourData) {
      setNodeData(
        GetNodesFromPixelData(pixelColourData, width, height, props.isMobile)
      );
    }
  }, [pixelColourData, width, height, props.isMobile]);

  useEffect(() => {
    const image = new Image();
    image.src = props.splashImagePath;
    image.onload = () => {
      setSplashImageLoaded(true);
    };

    if (canvasRef.current && nodeData && splashImageLoaded) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      let nodes = nodeData;
      let initatedNodes: CustomNode[] = [];

      const addNodeAtInterval = () => {
        if (nodes.length) {
          for (let i = pixelColourData!.width; i > 0; i--) {
            let nextNode = nodes.pop();
            if (nextNode) {
              initatedNodes.push(Object.create(nextNode));
            }
          }

          // Add the next node from allData to nodes
          simulation.nodes(initatedNodes); // Update the simulation with the new set of nodes
          simulation.alpha(1).restart(); // Reheat and restart the simulation
          console.log("Initiated nodes. Size:", initatedNodes.length);
        } else {
          clearInterval(intervalId); // Stop adding nodes when nodes is empty
        }
      };

      // Start adding nodes at regular intervals
      let intervalId = setInterval(addNodeAtInterval, 100);

      const pointermoved = (event: PointerEvent) => {
        if (initatedNodes.length > 0 && !props.isMobile) {
          const [pointerX, pointerY] = d3.pointer(event);
          initatedNodes[0].fx = pointerX - width / 2;
          initatedNodes[0].fy = pointerY - height / 2;
        }
      };

      const pointerExit = (event: PointerEvent) => {
        initatedNodes[0].fx = null;
        initatedNodes[0].fy = null;
      };

      const ticked = () => {
        context.clearRect(0, 0, width, height);
        context.save();
        context.translate(width / 2, height / 2);

        if (initatedNodes.length) {
          context.save();
          const splashNode = initatedNodes[0];
          context.beginPath();
          context.moveTo(splashNode.x + splashNode.r, splashNode.y);
          context.arc(splashNode.x, splashNode.y, splashNode.r, 0, 2 * Math.PI);
          context.closePath();
          context.clip();

          context.drawImage(
            image,
            splashNode.x - splashNode.r,
            splashNode.y - splashNode.r,
            splashNode.r * 2,
            splashNode.r * 2
          );
          context.restore();

          for (let i = 1; i < initatedNodes.length; ++i) {
            const d = initatedNodes[i];
            context.beginPath();
            context.moveTo(d.x + d.r, d.y);
            context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
            context.fillStyle = i == 0 ? "#ff0000" : initatedNodes[i].color;
            context.fill();
          }
        }
        context.restore();
      };

      const handleClick = (event: PointerEvent) => {
        if (event.target === canvas) {
          // Get pointer position (incl canvas position translation)
          const [pointerX, pointerY] = d3.pointer(event);
          const dx = pointerX - width / 2 - initatedNodes[0].x;
          const dy = pointerY - height / 2 - initatedNodes[0].y;

          // Open link if within bounds of initatedNodes[0] (splash image)
          if (dx * dx + dy * dy < initatedNodes[0].r * initatedNodes[0].r) {
            openInNewTab(props.splashClickLink);
          }
        }
      };

      const simulation = d3
        .forceSimulation<CustomNode>(initatedNodes)
        .alphaTarget(0.5)
        .velocityDecay(0.1)
        .force(
          "homeingForceX",
          d3.forceX<CustomNode>((d) => d.homeX).strength((d) => 0.01)
        )
        .force(
          "homeingForcYe",
          d3.forceY<CustomNode>((d) => d.homeY).strength((d) => 0.01)
        )
        .force(
          "collide",
          d3
            .forceCollide<CustomNode>()
            .radius((d) => d.r + 1)
            .strength(0.1)
            .iterations(1)
        )
        .on("tick", ticked);

      d3.select(canvas)
        .on("pointermove", pointermoved)
        .on("pointerleave", pointerExit)
        .on("click", handleClick);

      return () => {
        simulation.stop();
      }; // Cleanup function to stop the simulation
    }
  }, [nodeData, width, height, pixelColourData]);

  return nodeData ? (
    <canvas
      className="d3-component"
      width={width}
      height={height}
      ref={canvasRef}
      style={{ cursor: "crosshair" }}
    />
  ) : (
    <p>Node data is loading...</p>
  );
}

function GetNodesFromPixelData(
  pixels: IPixelColourData,
  containerWidth: number,
  containerHeight: number,
  isMobile: boolean
): CustomNode[] {
  let containerScale = containerWidth / containerHeight;
  // Adjust border based on canvas scale + if device is mobile
  let border = isMobile
    ? 32
    : containerScale < 1
    ? containerWidth / 3
    : containerHeight / 2;

  let borderedContainerWidth = containerWidth - border;
  let borderedContainerHeight = containerHeight - border;
  var scale = borderedContainerWidth / (pixels.width * 2);

  var radius = d3.randomUniform(scale / 2, scale);

  let imgScale = 1;
  let xPosOffset = 0;
  let yPosOffset = 0;

  // Update offsets and scaling depending on container shape
  if (containerScale < 1) {
    imgScale = borderedContainerWidth / pixels.width;
    xPosOffset = (pixels.width * imgScale) / 2;
    yPosOffset = (pixels.height * imgScale) / 2;
  } else {
    imgScale = borderedContainerHeight / pixels.height;
    scale = borderedContainerHeight / (pixels.height * 2);
    radius = d3.randomUniform(scale / 2, scale);
    xPosOffset = (pixels.width * imgScale) / 2;
    yPosOffset = (pixels.height * imgScale) / 2;
  }

  // Build node
  let nodeArrayFromPixelData = Array.from(
    { length: pixels.colourData.length },
    (_, i) => ({
      r: i == 0 ? 10 : radius(),
      alphaValue: pixels.colourData[i].a,
      color: d3
        .rgb(
          pixels.colourData[i].r,
          pixels.colourData[i].g,
          pixels.colourData[i].b,
          pixels.colourData[i].a == 255 ? 255 : 0
        )
        .toString(),
      x: (i % pixels.width) * imgScale - xPosOffset,
      y: -containerHeight / 2,
      homeX: (i % pixels.width) * imgScale - xPosOffset,
      homeY: i / (pixels.width / imgScale) - yPosOffset,
    })
  );

  // Remove unnecessary transparent nodes
  let filteredNodeArray = nodeArrayFromPixelData.filter(
    (element) => element.alphaValue > 128
  );

  // Add a node for the splashImage
  filteredNodeArray.push({
    r: isMobile ? containerWidth / 8 : containerWidth / 32,
    color: "black",
    x: -xPosOffset,
    y: -containerHeight / 2,
    homeX: -containerWidth / 2 + radius() * (isMobile ? 20 : 10),
    homeY: -containerHeight / 2 + radius() * (isMobile ? 20 : 10),
    alphaValue: 255,
  });

  return filteredNodeArray;
}

export default D3NodeGraphic;
