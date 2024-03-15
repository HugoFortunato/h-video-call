/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { VideoPlayer } from './VideoPlayer';

const APP_ID = 'a0e3cee049e94acb9ecf507387d64f28';
const TOKEN =
  '007eJxTYCg5OFl3/ts02XnfFj3Qff5R32v7xUWZj/9YlHPGcLIFG8UoMCQapBonp6YamFimWpokJidZpianmRqYG1uYp5iZpBlZbHP+ktoQyMiwZeMJJkYGRgYWIAbxmcAkM5hkAZOsDBlp+UUlDAwAUK0kUA==';
const CHANNEL = 'hfort';

AgoraRTC.setLogLevel(4);

let agoraCommandQueue = Promise.resolve();

const createAgoraClient = ({ onVideoTrack, onUserDisconnected }: any) => {
  const client = AgoraRTC.createClient({
    mode: 'rtc',
    codec: 'vp8',
  });

  let tracks: any;

  const waitForConnectionState = (connectionState: any) => {
    return (resolve: any) => {
      const interval = setInterval(() => {
        if (client.connectionState === connectionState) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    };
  };

  const connect = async () => {
    await waitForConnectionState('DISCONNECTED');

    const uid = await client.join(APP_ID, CHANNEL, TOKEN, null);

    client.on('user-published', (user: any, mediaType: any) => {
      client.subscribe(user, mediaType).then(() => {
        if (mediaType === 'video') {
          onVideoTrack(user);
        }
      });
    });

    client.on('user-left', (user: any) => {
      onUserDisconnected(user);
    });

    tracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    await client.publish(tracks);

    return {
      tracks,
      uid,
    };
  };

  const disconnect = async () => {
    await waitForConnectionState('CONNECTED');
    client.removeAllListeners();
    for (const track of tracks) {
      track.stop();
      track.close();
    }
    await client.unpublish(tracks);
    await client.leave();
  };

  return {
    disconnect,
    connect,
  };
};

export const VideoRoom = () => {
  const [users, setUsers] = useState([]);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const onVideoTrack = (user: any) => {
      setUsers((previousUsers) => [...previousUsers, user] as any);
    };

    const onUserDisconnected = (user: any) => {
      setUsers((previousUsers) =>
        previousUsers.filter((u: any) => u.uid !== user.uid)
      );
    };

    const { connect, disconnect } = createAgoraClient({
      onVideoTrack,
      onUserDisconnected,
    });

    const setup = async () => {
      const { tracks, uid }: any = await connect();
      setUid(uid);
      setUsers(
        (previousUsers) =>
          [
            ...previousUsers,
            {
              uid,
              audioTrack: tracks[0],
              videoTrack: tracks[1],
            },
          ] as any
      );
    };

    const cleanup = async () => {
      await disconnect();
      setUid(null);
      setUsers([]);
    };

    // setup();
    agoraCommandQueue = agoraCommandQueue.then(setup);

    return () => {
      // cleanup();
      agoraCommandQueue = agoraCommandQueue.then(cleanup);
    };
  }, []);

  return (
    <>
      {uid}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 200px)',
          }}
        >
          {users.map((user: any) => (
            <VideoPlayer key={user.uid} user={user} />
          ))}
        </div>
      </div>
    </>
  );
};
