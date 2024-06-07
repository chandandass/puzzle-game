import React, { useRef, useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet, Button, Image as RNImage, PixelRatio, Text } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import Canvas, { Image as CanvasImage, CanvasRenderingContext2D } from 'react-native-canvas';
import { mageImage } from './mageimage';
import { pathImage } from './path';
import { frog } from './frog';
import { dragonfly } from './dragonfly';
import { mazePath } from './mazePath';

let { width: displayWidth, height: displayHeight } = Dimensions.get('window');
const PATH_COLOR = '#F9F7DC'
const startPoint = { x: 85 , y: 424 }
const endPoint = { x: 165, y: 633 }
console.log("displayWidth: ", displayWidth, "displayHeight: ", displayHeight)
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
    const backgroundCanvas = backgroundCanvasRef.current;
    if (backgroundCanvas) {
      backgroundCanvas.width = displayWidth;
      backgroundCanvas.height = displayHeight;
      backgroundContext = backgroundCanvas.getContext('2d');
      loadImage(backgroundContext);
      // backgroundContext.arc(displayWidth * .15, displayHeight * .55, 5, 0,  2 * Math.PI)
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
    
    return "#" + hex(r) + hex(g) + hex(b)
    // Concatenate the hex values into a single string
  }
  
  const loadImage = async (context: CanvasRenderingContext2D | null) => {
    if (context && backgroundCanvasRef.current) {
      const image = new CanvasImage(backgroundCanvasRef.current);
      const anim1 = new CanvasImage(backgroundCanvasRef.current);
      const anim2 = new CanvasImage(backgroundCanvasRef.current);
      // const imageUri = RNImage.resolveAssetSource(require('../assets/maze/path.png')).uri;
      
      // convertImageToBase64(imageUri).then((base64String) => {
      //   if (base64String) {
      //     image.src = base64String;
      //   }
      //   });
      
      image.src = pathImage;

      image.addEventListener('load', () => {
        // const pathContainer = { width: displayWidth * .7, height: displayHeight * .5}
        const pathContainer = { width: 360, height: displayHeight * .5}
        const imageAR = image.width / image.height;
        const containerAr = pathContainer.width / pathContainer.height;
        if(imageAR > containerAr) {
          imageDim = {width: pathContainer.width, height: pathContainer.width / imageAR};
          } else {
          imageDim = {width: pathContainer.height, height: pathContainer.height * imageAR};
        }
 
        console.log("imageAr", imageAR)
        console.log("imageDim: ", imageDim);
        // imageDim = {width: displayWidth * widthPercent, height: (displayWidth * widthPercent) / imageAR};
        // console.log("half of wp: ", (1-widthPercent)/2)
        // const pathStart = {x: displayWidth * ((1 - widthPercent)/2), y: displayWidth *  ((heightRatio * 3.5))}
        const heightRatio = (displayHeight / imageDim.height);
        const widthRatio = (displayWidth / imageDim.width);
        const imageStarting = {x: (displayWidth - imageDim.width) / 2, y: displayHeight * .8  - imageDim.height}
        console.log("imageDim: ", imageDim);
        finalStartPoint = {x: (startPoint.x * widthRatio), y: (startPoint.y * heightRatio)};
        finalEndPoint = {x: endPoint.x * widthRatio, y: endPoint.y * heightRatio, w: 10, h: 10};
        // drawingContext.fillRect(displayWidth * .2 + (((displayWidth * .7) / imageDim.width ) * 231.9), displayHeight * .55 + (((displayWidth * .7) / imageAR) / imageDim.height * 38.82), 10,10)
        // context.drawImage(image, displayWidth * .2, displayHeight * .9 - (displayWidth * widthPercent) / imageAR, displayWidth * widthPercent, (displayWidth * widthPercent) / imageAR); 
        context.drawImage(image,  imageStarting.x, imageStarting.y, imageDim.width, imageDim.height); 
        
        anim1.src = frog;
        anim2.src = dragonfly;
        const anim1Diff = {x: -0.1, y: 0};
        const anim2Diff = {x: 0, y: 0};
        anim1.addEventListener('load', ()=> {
          console.log("anim1")
          context.drawImage(anim1, imageStarting.x + (displayWidth * anim1Diff.x), imageStarting.y - anim1.height + anim1Diff.y, anim1.width, anim1.height); 
        })
  
        anim2.addEventListener('load', ()=> {
          console.log("anim2")
          // drawingContext.fillRect( displayWidth * .15, displayHeight * .45 + imageDim.height , 10,10)
          context.drawImage(anim2, imageStarting.x + anim2Diff.x , imageStarting.y + imageDim.height + anim2Diff.y, anim2.width, anim2.height); 
        })
      });


    }
  };
  
  const clearDrawingCanvas = () => {
    if (drawingContext && drawingCanvasRef.current) {
      drawingContext.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
      // finalStartPoint.x = startPoint.x * (displayWidth / imageDim.width)
      // finalStartPoint.y = startPoint.y * (displayHeight / imageDim.height)
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
          // if(PATH_COLOR.toLowerCase() == colorHex.toLowerCase()) {
          //   // console.log("*************************** match found ******************************");
          //   if( finalEndPoint.x <= x && x <= (finalEndPoint.x + finalEndPoint.w) &&  finalEndPoint.y <= y && y <= (finalEndPoint.y + finalEndPoint.h)) {
          //     console.log("***game completed***")
          //     isDrawingStop=true;
          //   }
          // } else {
          //   console.log("else x:y", x, y)
          //   console.log("color hex: ", colorHex)
          //   console.log("****game over*****");
          //   isDrawingStop = true;
          //   clearDrawingCanvas();
          // }
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
          <RNImage source={require("../assets/maze/background.png")} style={{position:'absolute', zIndex: -1, width: "100%", height: "100%"}} resizeMode='cover' />
        </View>
      </PanGestureHandler>
      <View style={styles.controls}>
        <Button title="Clear Canvas" onPress={clearDrawingCanvas} />
      </View>
      <View style={styles.title}> 
        <Text style={styles.titleText}>Help Meghuchi find the way to the dragonfly</Text>
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
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    zIndex: 2,
  },
  title: {
    position: 'absolute',
    top: "8%",
    left: "10%",
    right: 0,
    alignItems: 'center',
    padding: 10,
    maxWidth: "80%",
    borderWidth: 1,
    borderRadius: 30,
    justifyContent: "center",
    borderColor: '#C98936',
    backgroundColor: '#009245',
  }, 
  titleText: {
    color: "#FFFFFF", 
    textAlign: 'center', 
    letterSpacing: 1
  }
});

export default CanvasComponent;
