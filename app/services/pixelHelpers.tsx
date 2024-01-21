import getPixels from "get-pixels";
import { NdArray } from "ndarray";

export const getPixelsFromPath = (imagePath: string) => {
    return new Promise<NdArray<Uint8Array>>((resolve, reject) => {
        getPixels(imagePath, function(err, pixels) {
            if(err) {
              console.log("Bad image path")
              reject(Error("Could not load image data"));
            }
            resolve(pixels);
          })
    })
}

export interface IRGBData {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface IPixelColourData {
    width: number;
    height: number;
    colourData: IRGBData[];
}

export const pixelDataToColors = (pixels: NdArray<Uint8Array>): IPixelColourData => {
    let pixelStride = pixels.stride[0];

    if (pixelStride !== 4) {
        console.error("Image contains more than 4 channels per pixel, img may not convert correctly.");
    }

    let allPixels: Array<IRGBData> = [];

    for(let p = 0; p < pixels.data.length / pixels.stride[0]; p++) {
        allPixels.push({r: pixels.data[p*pixelStride], g: pixels.data[p*pixelStride+1], b: pixels.data[p*pixelStride+2], a: pixels.data[p*pixelStride+3]});
    }

    return { width: pixels.shape[0], height: pixels.shape[1], colourData: allPixels }
}