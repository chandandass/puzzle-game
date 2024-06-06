import React, { useRef, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { View, Dimensions, StyleSheet, Button, Image as RNImage, PixelRatio } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import Canvas, { Image as CanvasImage, CanvasRenderingContext2D } from 'react-native-canvas';
import { mageImage } from './mageimage';

let { width: displayWidth, height: displayHeight } = Dimensions.get('window');
const PATH_COLOR = '#F9F7DC'
const startPoint = { x: 85 , y: 424 }
const endPoint = { x: 165, y: 633 }

const CanvasComponent: React.FC = () => {
  const backgroundCanvasRef = useRef<Canvas | null>(null);
  const drawingCanvasRef = useRef<Canvas | null>(null);
  let drawingContext: CanvasRenderingContext2D | null = null;
  let backgroundContext: CanvasRenderingContext2D | null = null;
  let imageDim = {width: 0, height: 0};
  let finalStartPoint = {x: 0, y: 0};
  let finalEndPoint = {x: 0, y: 0, w: 0, h: 0};
  let xyDiff = {x: 0, y: 0};
  let isDrawing = false;
  let isDrawingStop = false;

  useEffect(() => {
    Toast.show({
      type: 'success',
      text1: "text1"
    })
    const backgroundCanvas = backgroundCanvasRef.current;
    if (backgroundCanvas) {
      backgroundCanvas.width = displayWidth;
      backgroundCanvas.height = displayHeight;
      backgroundContext = backgroundCanvas.getContext('2d');
      loadImage(backgroundContext);
      // backgroundContext.arc(155, 536, 5, 0,  2 * Math.PI)
      // backgroundContext.fill();
      
    }
    
    const drawingCanvas = drawingCanvasRef.current;
    if (drawingCanvas) {
      drawingCanvas.width = displayWidth;
      drawingCanvas.height = displayHeight;
      drawingContext = drawingCanvas.getContext('2d');
      if (drawingContext) {
        drawingContext.lineWidth = 1.5;
        drawingContext.strokeStyle = 'red';
        drawingContext.fillStyle = 'green'
      }
    }
  }, []);
  
  function drawCircle(color: string) {
    backgroundContext.beginPath();
    backgroundContext.fillStyle = color;
    backgroundContext.arc(40, 680, 15, 0,  2 * Math.PI)
    backgroundContext.fill();
  }
  
  const convertImageToBase64 = async (uri: any) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return null;
    }
  }
  
  function rgbaToHex(r: number, g: number, b: number, a: number) : string {
    // Ensure the alpha value is in the range 0-1
    if (a < 0 || a > 1) {
      throw new Error("Alpha value out of range");
    }
    
    // Convert the alpha value to the range 0-255
    let alpha = Math.round(a * 255);
    
    // Convert each component to a two-digit hexadecimal value
    let hex = (c: number) => {
      let hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    };
    
    // Concatenate the hex values into a single string
    return "#" + hex(r) + hex(g) + hex(b)
  }
  
  const loadImage = async (context: CanvasRenderingContext2D | null) => {
    if (context && backgroundCanvasRef.current) {
      const image = new CanvasImage(backgroundCanvasRef.current);
      const imageUri = RNImage.resolveAssetSource(require('../assets/maze/meghuchiTest.png')).uri;
      
      convertImageToBase64(imageUri).then((base64String) => {
        if (base64String) {
          image.src = mageImage;
        }
      });
      
      image.addEventListener('load', () => {
        imageDim = {width: image.width, height: image.height};
        const heightRatio = (displayHeight / imageDim.height);
        const widthRatio = (displayWidth / imageDim.width);

        finalStartPoint = {x: (startPoint.x * widthRatio), y: (startPoint.y * heightRatio)};
        finalEndPoint = {x: endPoint.x * widthRatio, y: endPoint.y * heightRatio, w: 10, h: 10};
        drawingContext.fillRect(endPoint.x * widthRatio, endPoint.y * heightRatio, 10,10)
        context.drawImage(image, 0, 0, displayWidth, displayHeight); 
      });
    }
  };
  
  const clearDrawingCanvas = () => {
    if (drawingContext && drawingCanvasRef.current) {
      drawingContext.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
      finalStartPoint.x = startPoint.x * (displayWidth / imageDim.width)
      finalStartPoint.y = startPoint.y * (displayHeight / imageDim.height)
    }
  };
  
  async function handleGestureEvent(event: any) {
    let { nativeEvent: { absoluteX, absoluteY, state } } = event;
    absoluteX = absoluteX * .8;
    absoluteY = absoluteY * .8;
    let x = (xyDiff.x + absoluteX);
    let y = (xyDiff.y + absoluteY);
    console.log("final x: y", finalStartPoint.x, finalStartPoint.y)
    switch (state) {
      case State.ACTIVE:
        if(isDrawingStop) return;
        if (drawingContext) {
          if (!isDrawing) {
          xyDiff.x = (finalStartPoint.x - absoluteX);
          xyDiff.y = (finalStartPoint.y - absoluteY);
          x = xyDiff.x + absoluteX;
          y = xyDiff.y + absoluteY;
          drawingContext.beginPath();
          drawingContext.moveTo(x, y);
        } else {
          drawingContext.lineTo(x, y);
          drawingContext.stroke()     
          finalStartPoint.x = x
          finalStartPoint.y = y       
        }
        isDrawing = true;
      }
      if (backgroundContext) {
        try {
          console.log("x:y", x, y)
          const finalX = x * PixelRatio.get();
          const finalY = y * PixelRatio.get();
          const pixelData = (await backgroundContext.getImageData(finalX, finalY, 1, 1)).data;
          console.log(pixelData)
          const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
          const colorHex = rgbaToHex(pixelData[0], pixelData[1], pixelData[2], pixelData[3] / 255).toLowerCase()
          if(PATH_COLOR.toLowerCase() == colorHex.toLowerCase()) {
            // console.log("*************************** match found ******************************");
            if( finalEndPoint.x <= x && x <= (finalEndPoint.x + finalEndPoint.w) &&  finalEndPoint.y <= y && y <= (finalEndPoint.y + finalEndPoint.h)) {
              console.log("***game completed***")
              isDrawingStop=true;
            }
          } else {
            console.log("else x:y", x, y)
            console.log("color hex: ", colorHex)
            console.log("****game over*****");
            isDrawingStop = true;
            clearDrawingCanvas();
          }
          // drawCircle(color);
      } catch (error) {
          console.error("Error getting pixel data:", error);
      }
      }
      break;

      case State.END:
        isDrawingStop = false;
        isDrawing = false;
        break;
      default:
    }
  }


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleGestureEvent}>
        <View style={{ flex: 1 }}>
          <Canvas
            ref={backgroundCanvasRef}
            style={[styles.canvas, styles.backgroundCanvas]}
          />
          <Canvas
            ref={drawingCanvasRef}
            style={styles.canvas}
          />
        </View>
      </PanGestureHandler>
      <View style={styles.controls}>
        <Button title="Clear Canvas" onPress={clearDrawingCanvas} />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    width: displayWidth,
    height: displayHeight,
  },
  backgroundCanvas: {
    zIndex: 0,
  },
  drawingCanvas: {
    zIndex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    zIndex: 2,
  },
});

export default CanvasComponent;
