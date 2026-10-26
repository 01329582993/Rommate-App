import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Asset } from 'expo-asset';

interface SafeCampusVideoProps {
  style?: any;
}

export const SafeCampusVideo: React.FC<SafeCampusVideoProps> = ({ style }) => {
  // Web implementation (works 100% reliably in all browsers)
  if (Platform.OS === 'web') {
    let videoUri = '/iut_campus.mp4';
    try {
      const asset = Asset.fromModule(require('../../assets/iut_campus.mp4'));
      if (asset?.uri) videoUri = asset.uri;
    } catch (e) {
      // fallback to static public url
    }

    return (
      <View style={[StyleSheet.absoluteFill, style, { overflow: 'hidden' }]} pointerEvents="none">
        {/* @ts-ignore */}
        <video
          src={videoUri}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </View>
    );
  }

  // Native (Android / iOS): Use resilient dynamic import for Expo Go compatibility
  return <NativeCampusVideo style={style} />;
};

function NativeCampusVideo({ style }: { style?: any }) {
  const [VideoComponent, setVideoComponent] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    try {
      // 1. Try expo-video (modern Expo SDK standard)
      const expoVideo = require('expo-video');
      if (expoVideo && expoVideo.VideoView && expoVideo.useVideoPlayer) {
        setVideoComponent(() => ({
          type: 'expo-video',
          VideoView: expoVideo.VideoView,
          useVideoPlayer: expoVideo.useVideoPlayer,
        }));
        return;
      }
    } catch (e) {
      // expo-video native module not in this client
    }

    try {
      // 2. Try expo-av if present in native runtime
      const expoAV = require('expo-av');
      if (expoAV && expoAV.Video) {
        setVideoComponent(() => ({
          type: 'expo-av',
          Video: expoAV.Video,
          ResizeMode: expoAV.ResizeMode,
        }));
        return;
      }
    } catch (e) {
      // expo-av native module not in this client
    }

    return () => {
      isMounted = false;
    };
  }, []);

  if (!VideoComponent) {
    return null;
  }

  if (VideoComponent.type === 'expo-av') {
    const { Video, ResizeMode } = VideoComponent;
    return (
      <Video
        source={require('../../assets/iut_campus.mp4')}
        style={[StyleSheet.absoluteFill, style]}
        resizeMode={ResizeMode?.COVER || 'cover'}
        shouldPlay
        isLooping
        isMuted
      />
    );
  }

  if (VideoComponent.type === 'expo-video') {
    return <ExpoVideoPlayer VideoView={VideoComponent.VideoView} useVideoPlayer={VideoComponent.useVideoPlayer} style={style} />;
  }

  return null;
}

function ExpoVideoPlayer({ VideoView, useVideoPlayer, style }: any) {
  try {
    const asset = require('../../assets/iut_campus.mp4');
    const player = useVideoPlayer(asset, (p: any) => {
      p.loop = true;
      p.muted = true;
      p.play();
    });
    return (
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, style]}
        contentFit="cover"
        nativeControls={false}
      />
    );
  } catch (err) {
    return null;
  }
}
