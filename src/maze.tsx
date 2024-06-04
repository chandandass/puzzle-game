import React, { useRef, useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet, Button, Image as RNImage } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import Canvas, { Image as CanvasImage, CanvasRenderingContext2D } from 'react-native-canvas';

const { width: displayWidth, height: displayHeight } = Dimensions.get('window');

const CanvasComponent: React.FC = () => {
  const backgroundCanvasRef = useRef<Canvas | null>(null);
  const drawingCanvasRef = useRef<Canvas | null>(null);
  let drawingContext: CanvasRenderingContext2D | null = null;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  useEffect(() => {
    const backgroundCanvas = backgroundCanvasRef.current;
    if (backgroundCanvas) {
      backgroundCanvas.width = displayWidth;
      backgroundCanvas.height = displayHeight;
      const backgroundContext = backgroundCanvas.getContext('2d');
      loadImage(backgroundContext);
    }

    const drawingCanvas = drawingCanvasRef.current;
    if (drawingCanvas) {
      drawingCanvas.width = displayWidth;
      drawingCanvas.height = displayHeight;
      drawingContext = drawingCanvas.getContext('2d');
      if (drawingContext) {
        drawingContext.lineWidth = 1;
        drawingContext.strokeStyle = 'green';
      }
    }
  }, []);

  const loadImage = async (context: CanvasRenderingContext2D | null) => {
    if (context && backgroundCanvasRef.current) {
      const image = new CanvasImage(backgroundCanvasRef.current);
      const imageUri = RNImage.resolveAssetSource(require('../assets/maze/meghuchi.png')).uri;

      image.src = imageUri;

      image.addEventListener('load', () => {
        context.drawImage(image, 0, 0, displayWidth, displayHeight);
      });
    }
  };

  const clearDrawingCanvas = () => {
    if (drawingContext && drawingCanvasRef.current) {
      drawingContext.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }
  };

  function handleGestureEvent(event: any) {
    const { nativeEvent: { absoluteX, absoluteY, state } } = event;

    switch (state) {
      case State.ACTIVE:
        if (drawingContext) {
          if (!isDrawing) {
            drawingContext.beginPath();
            drawingContext.moveTo(absoluteX, absoluteY);
          } else {
            drawingContext.lineTo(absoluteX, absoluteY);
            drawingContext.stroke();
          }
          lastX = absoluteX;
          lastY = absoluteY;
          isDrawing = true;
        }
        break;
      case State.END:
        isDrawing = false;
        break;
      default:
        break;
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
