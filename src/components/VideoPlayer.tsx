/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';

export const VideoPlayer = ({ user }: any) => {
  const ref = useRef();

  useEffect(() => {
    user.videoTrack.play(ref.current);
  }, []);

  return (
    <div>
      Uid: {user.uid}
      <div ref={ref as any} style={{ width: '200px', height: '200px' }}></div>
    </div>
  );
};
