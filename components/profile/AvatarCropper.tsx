import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Icon } from '@/components/ui';
import { toast } from '@/lib/toast';
import { ACCENT } from '@/lib/tokens';

export type CropSource = { uri: string; width: number; height: number };

const MAX_ZOOM = 4;
const OUTPUT = 512;
const MASK = 'rgba(0,0,0,0.6)';

// Full-screen crop step between picking a profile photo and uploading it:
// drag and pinch the photo inside a circle (zoom buttons on web, which has no
// pinch), then the visible square is cropped and resized to 512px on-device.
export function AvatarCropper({
  source,
  onCancel,
  onDone,
}: {
  source: CropSource;
  onCancel: () => void;
  onDone: (uri: string) => void;
}) {
  const { width: screenW } = useWindowDimensions();
  const S = Math.min(screenW - 32, 380);
  const { uri, width: w, height: h } = source;
  const base = S / Math.min(w, h);
  const [busy, setBusy] = useState(false);

  const zoom = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const start = useSharedValue({ zoom: 1, tx: 0, ty: 0 });

  const bound = (v: number, z: number, dim: number) => {
    'worklet';
    const max = Math.max(0, (dim * base * z - S) / 2);
    return Math.min(max, Math.max(-max, v));
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      start.value = { zoom: zoom.value, tx: tx.value, ty: ty.value };
    })
    .onUpdate((e) => {
      tx.value = bound(start.value.tx + e.translationX, zoom.value, w);
      ty.value = bound(start.value.ty + e.translationY, zoom.value, h);
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      start.value = { zoom: zoom.value, tx: tx.value, ty: ty.value };
    })
    .onUpdate((e) => {
      const z = Math.min(MAX_ZOOM, Math.max(1, start.value.zoom * e.scale));
      zoom.value = z;
      tx.value = bound(tx.value, z, w);
      ty.value = bound(ty.value, z, h);
    });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: zoom.value }],
  }));

  const stepZoom = (delta: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, zoom.value + delta));
    zoom.value = z;
    tx.value = bound(tx.value, z, w);
    ty.value = bound(ty.value, z, h);
  };

  const done = async () => {
    setBusy(true);
    try {
      const total = base * zoom.value;
      const size = Math.min(w, h, S / total);
      const originX = Math.round(Math.min(w - size, Math.max(0, w / 2 - tx.value / total - size / 2)));
      const originY = Math.round(Math.min(h - size, Math.max(0, h / 2 - ty.value / total - size / 2)));
      const side = Math.floor(size);
      const rendered = await ImageManipulator.manipulate(uri)
        .crop({ originX, originY, width: side, height: side })
        .resize({ width: OUTPUT, height: OUTPUT })
        .renderAsync();
      const out = await rendered.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
      onDone(out.uri);
    } catch (e: any) {
      toast.error("Couldn't crop photo", e?.message);
      setBusy(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <View className="flex-row items-center justify-between px-5 pb-3 pt-14">
          <Pressable onPress={onCancel} disabled={busy} accessibilityRole="button" hitSlop={10}>
            <Text className="text-base text-white">Cancel</Text>
          </Pressable>
          <Text className="text-base font-semibold text-white">Move and scale</Text>
          <Pressable onPress={done} disabled={busy} accessibilityRole="button" hitSlop={10}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-semibold" style={{ color: ACCENT }}>Choose</Text>}
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center">
          <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
            <View style={{ width: S, height: S, overflow: 'hidden' }}>
              <Animated.View
                style={[
                  { position: 'absolute', left: (S - w * base) / 2, top: (S - h * base) / 2, width: w * base, height: h * base },
                  imageStyle,
                ]}>
                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="fill" />
              </Animated.View>
              <Svg width={S} height={S} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
                <Path
                  d={`M0 0H${S}V${S}H0Z M${S / 2} 0A${S / 2} ${S / 2} 0 1 0 ${S / 2} ${S}A${S / 2} ${S / 2} 0 1 0 ${S / 2} 0Z`}
                  fill={MASK}
                  fillRule="evenodd"
                />
                <Circle cx={S / 2} cy={S / 2} r={S / 2 - 0.5} stroke="rgba(255,255,255,0.7)" strokeWidth={1} fill="none" />
              </Svg>
            </View>
          </GestureDetector>
          {Platform.OS === 'web' ? (
            <View className="mt-6 flex-row gap-4">
              <Pressable onPress={() => stepZoom(-0.25)} accessibilityRole="button" accessibilityLabel="Zoom out" className="rounded-full bg-white/15 p-3">
                <Icon name="zoom-out" size={20} color="#fff" />
              </Pressable>
              <Pressable onPress={() => stepZoom(0.25)} accessibilityRole="button" accessibilityLabel="Zoom in" className="rounded-full bg-white/15 p-3">
                <Icon name="zoom-in" size={20} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Text className="mt-6 text-sm text-white/60">Pinch to zoom, drag to move</Text>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
