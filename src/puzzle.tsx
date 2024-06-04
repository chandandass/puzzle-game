import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, LayoutChangeEvent, findNodeHandle, UIManager } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';

interface PuzzlePieceProps {
  id: string;
  src: number;
  x: number;
  y: number;
  zIndex: number;
}
const {width : displayWidth, height: displayHeight} = Dimensions.get("window");

const SIZE = (displayWidth) < (displayHeight) ? (displayWidth) : (displayHeight)
const BOX_SIZE = SIZE / 3;
const OUTLINE_SIZE = SIZE * 0.80;
const MIN_COUNTER = 5;
const puzzlePieces: PuzzlePieceProps[] = [
  { id: 'piece1', src: require('../assets/pieces/back-leg.png'), x: 15, y: 108, zIndex: 1},
  { id: 'piece2', src: require('../assets/pieces/beard.png'), x: 258, y: 142.14, zIndex: 0 },
  { id: 'piece4', src: require('../assets/pieces/front-leg.png'), x: 110, y: 20, zIndex: 1},
  { id: 'piece3', src: require('../assets/pieces/body.png'), x: 39, y: 25.14, zIndex: 0},
  { id: 'piece5', src: require('../assets/pieces/fur.png'), x: 45, y: 0, zIndex: 0 },
  { id: 'piece6', src: require('../assets/pieces/head.png'), x: 214, y: 40, zIndex: 0 },
  { id: 'piece7', src: require('../assets/pieces/tail.png'), x: 0, y: 52.14, zIndex: 0 },
];

interface PuzzlePieceComponentProps {
  piece: PuzzlePieceProps;
  outlineOffset: { x: number; y: number };
  outlineDim: {original: {width: number; height: number}};
  outlineSFactor: number;
}
type ContextType = {
  counter: number;
  translateX: number;
  translateY: number;
  width: number;
  height: number;
  position: string;
};

const PuzzlePiece: React.FC<PuzzlePieceComponentProps> = ({ piece, outlineOffset, outlineDim , outlineSFactor}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);

  const [scaleValue, setScaleValue] = useState(1);
  const [originalDim, setOriginalDim] = useState({width: 0, height: 0});
  const [renderDim, setRenderDim] = useState({width: 0, height: 0});
  const [intialXY, setInitialXY] = useState({x: 0, y: 0});
  const [isDragDisabled, setIsDragDisabled] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);

  const panGestureEvent = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    ContextType
  >({
    onStart: (_, context) => {
      if(isDragDisabled) return true;
      scale.value = withSpring(scaleValue);
      zIndex.value = 100;
      context.translateX = translateX.value;
      context.translateY = translateY.value;
      context.counter = 0;
    },
    onActive: (event, context) => {
      if(isDragDisabled) return true;
      translateX.value = event.translationX  + context.translateX;
      translateY.value = event.translationY + context.translateY;

      const pieceWidthDiff = ((originalDim.width * outlineSFactor) - renderDim.width) /2 ;
      const pieceHeightDiff = ((originalDim.height * outlineSFactor) - renderDim.height) / 2;
      
      const pieceScaleWidth = (renderDim.width * scaleValue);
      const pieceScaleHeight = (renderDim.height * scaleValue);

      const positionX = ((intialXY.x - pieceWidthDiff) + ((event.translationX + context.translateX) / scaleFactor) + pieceScaleWidth/2 )
      const positionY = ((intialXY.y - pieceHeightDiff) + ((event.translationY + context.translateY) / scaleFactor) + pieceScaleHeight/2 )

      const finalPieceX = (OUTLINE_SIZE - (outlineDim.original.width * outlineSFactor))/2 + piece.x * outlineSFactor;
      const finalPieceY = (OUTLINE_SIZE - (outlineDim.original.height * outlineSFactor))/2 + piece.y * outlineSFactor;

      const xMatchPosition = outlineOffset.x + finalPieceX;
      const yMatchPosition = outlineOffset.y + finalPieceY;

      if((positionX >= xMatchPosition && positionX <= (xMatchPosition + pieceScaleWidth)) && (positionY >= yMatchPosition && positionY <= (yMatchPosition + pieceScaleHeight))) {
        console.log("\n\n********************Match found ****************************\n\n")
        console.log("context.counter: ", context.counter);
        context.counter++;
        if(context.counter > MIN_COUNTER ) {
          const finalTX = ((((outlineOffset.x + finalPieceX ) - (intialXY.x - pieceWidthDiff)) * scaleFactor));
          const finalTY = ((((outlineOffset.y + finalPieceY ) - (intialXY.y - pieceHeightDiff)) * scaleFactor));

          translateX.value = withSpring(finalTX);
          translateY.value = withSpring(finalTY);
          zIndex.value = piece.zIndex;
          runOnJS(setIsDragDisabled)(true);
      }
      } else {
        context.counter=0
      }

    },
    onEnd: () => {
      if(isDragDisabled) return true;
      zIndex.value = 1;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    },
  });

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {scale: scale.value},
        {
          translateX: translateX.value,
        },
        {
          translateY: translateY.value,
        },
      ],
      zIndex: zIndex.value
    };
  });

  const onLayout = (event : any) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    const source = Image.resolveAssetSource(piece.src);
    const widthScaling = BOX_SIZE / source.width;
    const heightScaling = BOX_SIZE / source.height;
    let scalingFactor = Math.min(widthScaling, heightScaling) / outlineSFactor;
    if(source.width <= BOX_SIZE && source.height <= BOX_SIZE) {
      scalingFactor = (1 / outlineSFactor);
    }
    const scaleX = source.width / (source.width * scalingFactor)
    const scaleY = source.height / (source.height * scalingFactor)

    setInitialXY({x: x, y: y});
    setRenderDim({width: width, height: height});
    setOriginalDim({width: source.width, height: source.height});
    setScaleValue(scaleX > scaleY ? scaleX : scaleY);
    setScaleFactor(scalingFactor);
  };

  return (
    <PanGestureHandler onGestureEvent={panGestureEvent}>
      <Animated.Image onLayout={onLayout}  source={piece.src} style={[styles.image, rStyle]} />
    </PanGestureHandler>

  );
};


const Puzzle: React.FC = () => {
  const outline = require('../assets/outline-image/outline.png')
  const [outlineOffset, setOutlineOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [outlineOriginalDim, setOutlineOriginalDim] = useState({width: 0, height: 0});
  const [scalingFactor, setScaleFactor] = useState<any | number>(null);
  const imageRef = useRef(null);

  useEffect(()=> {
    const originalImage = Image.resolveAssetSource(outline);
    const widthScaling = OUTLINE_SIZE / originalImage.width;
    const heightScaling = OUTLINE_SIZE / originalImage.height;
    const scaleFactor = Math.min(widthScaling, heightScaling);
    setScaleFactor(scaleFactor);
    setOutlineOriginalDim({width: originalImage.width, height: originalImage.height});
  },[])

  const handleOutlineLayout = (event: LayoutChangeEvent) => {
    const handle = findNodeHandle(imageRef.current);
      if (handle) {
        UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
          setOutlineOffset({ x: pageX, y: pageY });
        });
      }
  };


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={styles.container}>
      <View style={styles.upper}>
        {puzzlePieces.map((piece : any, index: number)=> {
          return <PuzzlePiece key={`pieces-${index}`} piece={piece} outlineOffset={outlineOffset} outlineDim={{original: outlineOriginalDim}} outlineSFactor={scalingFactor}/> 
        })}
      </View>
      <View style={styles.lower}>
      <Image
        ref={imageRef}
        source={outline}
        style={styles.outline}
        onLayout={handleOutlineLayout}
      />
      </View>
    </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc', // Match the background color of your image
  },
  upper: {
    flex:1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'center',
    flexWrap: 'wrap',
    rowGap: 15,
    paddingTop: 10,
  },
  lower: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    maxWidth: BOX_SIZE,
    maxHeight: BOX_SIZE,
    resizeMode: 'contain',
  },
  outline: {
    width: OUTLINE_SIZE,
    height: OUTLINE_SIZE,
    resizeMode: 'contain',
    zIndex: -100, // Ensure the outline is behind the pieces
  },
 
});

export default Puzzle;
